import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EmployeeType, Role } from '../common/enums/role.enum';
import { AuthUser } from '../common/types/auth-user.type';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';

type EmployeeSnapshot = {
  id: string;
  schoolId: string;
  type: EmployeeType | string;
  birthDate: Date | null;
  joinDate: Date | null;
};

@Injectable()
export class EmployeesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateEmployeeDto, user: AuthUser) {
    const schoolId = this.resolveWritableSchoolId(dto.schoolId, user);
    await this.ensureSchoolExists(schoolId);
    await this.ensureSchoolCanEdit(schoolId, user);

    // schoolId dari body hanya dipakai untuk menentukan relasi sekolah.
    // Field tanggal dihapus dari DTO mentah karena akan dikonversi dan dihitung ulang.
    const data = { ...dto };
    delete data.schoolId;
    delete data.birthDate;
    delete data.joinDate;

    return this.prisma.employee.create({
      data: {
        ...data,
        ...this.buildCalculatedFields({
          type: dto.type,
          birthDate: dto.birthDate,
          joinDate: dto.joinDate,
        }),
        schoolId,
      },
      include: {
        school: true,
      },
    });
  }

  async findAll(user: AuthUser, schoolId?: string, type?: EmployeeType) {
    const resolvedSchoolId = this.resolveReadableSchoolId(user, schoolId);

    return this.prisma.employee.findMany({
      where: {
        schoolId: resolvedSchoolId,
        type,
      },
      include: {
        school: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string, user: AuthUser) {
    const employee = await this.prisma.employee.findUnique({
      where: { id },
      include: {
        school: true,
      },
    });

    if (!employee) {
      throw new NotFoundException('Employee tidak ditemukan');
    }

    this.ensureCanAccessEmployee(employee.schoolId, user);

    return employee;
  }

  async update(id: string, dto: UpdateEmployeeDto, user: AuthUser) {
    const employee = await this.findEmployeeOrThrow(id);
    this.ensureCanManageEmployee(employee.schoolId, user);
    await this.ensureSchoolCanEdit(employee.schoolId, user);

    // Saat update, owner boleh memindahkan employee ke sekolah lain.
    // Role school tetap terkunci ke sekolah yang ada di token.
    const { schoolId, ...data } = dto;
    delete data.birthDate;
    delete data.joinDate;
    const nextSchoolId =
      user.role === Role.OWNER && schoolId ? schoolId : employee.schoolId;

    if (user.role === Role.OWNER && schoolId) {
      await this.ensureSchoolExists(schoolId);
    }

    return this.prisma.employee.update({
      where: { id },
      data: {
        ...data,
        ...this.buildCalculatedFields({
          type: dto.type ?? employee.type,
          birthDate: dto.birthDate ?? employee.birthDate,
          joinDate: dto.joinDate ?? employee.joinDate,
        }),
        schoolId: nextSchoolId,
      },
      include: {
        school: true,
      },
    });
  }

  async uploadPhoto(id: string, photoUrl: string, user: AuthUser) {
    const employee = await this.findEmployeeOrThrow(id);
    this.ensureCanManageEmployee(employee.schoolId, user);
    await this.ensureSchoolCanEdit(employee.schoolId, user);

    return this.prisma.employee.update({
      where: { id },
      data: { photoUrl },
      include: {
        school: true,
      },
    });
  }

  async uploadDecree(id: string, decreeUrl: string, user: AuthUser) {
    const employee = await this.findEmployeeOrThrow(id);
    this.ensureCanManageEmployee(employee.schoolId, user);
    await this.ensureSchoolCanEdit(employee.schoolId, user);

    return this.prisma.employee.update({
      where: { id },
      data: { decreeUrl },
      include: {
        school: true,
      },
    });
  }

  async remove(id: string, user: AuthUser) {
    const employee = await this.findEmployeeOrThrow(id);
    this.ensureCanManageEmployee(employee.schoolId, user);
    await this.ensureSchoolCanEdit(employee.schoolId, user);

    return this.prisma.employee.delete({
      where: { id },
    });
  }

  private resolveWritableSchoolId(
    schoolId: string | undefined,
    user: AuthUser,
  ) {
    // Role school tidak boleh menentukan schoolId sendiri dari body request.
    if (user.role === Role.SCHOOL) {
      if (!user.schoolId) {
        throw new ForbiddenException('User school belum terhubung ke sekolah');
      }

      return user.schoolId;
    }

    if (user.role === Role.OWNER && schoolId) {
      return schoolId;
    }

    throw new BadRequestException('schoolId wajib diisi');
  }

  private resolveReadableSchoolId(user: AuthUser, schoolId?: string) {
    // Role school hanya boleh membaca data milik sekolahnya sendiri.
    if (user.role === Role.SCHOOL) {
      if (!user.schoolId) {
        throw new ForbiddenException('User school belum terhubung ke sekolah');
      }

      return user.schoolId;
    }

    return schoolId;
  }

  private ensureCanAccessEmployee(schoolId: string, user: AuthUser) {
    if (user.role !== Role.SCHOOL) {
      return;
    }

    if (!user.schoolId || user.schoolId !== schoolId) {
      throw new ForbiddenException(
        'Tidak bisa mengakses employee sekolah lain',
      );
    }
  }

  private ensureCanManageEmployee(schoolId: string, user: AuthUser) {
    if (user.role === Role.OWNER) {
      return;
    }

    if (user.role === Role.SCHOOL && user.schoolId === schoolId) {
      return;
    }

    throw new ForbiddenException('Tidak bisa mengubah employee ini');
  }

  private async findEmployeeOrThrow(id: string): Promise<EmployeeSnapshot> {
    const employee = await this.prisma.employee.findUnique({
      where: { id },
      select: {
        id: true,
        schoolId: true,
        type: true,
        birthDate: true,
        joinDate: true,
      },
    });

    if (!employee) {
      throw new NotFoundException('Employee tidak ditemukan');
    }

    return employee;
  }

  private buildCalculatedFields(payload: {
    type?: EmployeeType | string;
    birthDate?: string | Date | null;
    joinDate?: string | Date | null;
  }) {
    // Semua field turunan dihitung di backend agar data tidak bisa dimanipulasi dari client.
    const birthDate = this.parseOptionalDate(payload.birthDate, 'birthDate');
    const joinDate = this.parseOptionalDate(payload.joinDate, 'joinDate');
    const retirementAge = this.getRetirementAge(payload.type);

    return {
      birthDate,
      joinDate,
      workingPeriod: joinDate
        ? this.calculateWorkingPeriod(joinDate)
        : undefined,
      retirementAge,
      retirementDate:
        birthDate && retirementAge
          ? this.calculateRetirementDate(birthDate, retirementAge)
          : undefined,
    };
  }

  private parseOptionalDate(
    value: string | Date | null | undefined,
    field: string,
  ) {
    if (!value) {
      return undefined;
    }

    const date = value instanceof Date ? value : new Date(value);

    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException(`${field} tidak valid`);
    }

    return date;
  }

  private calculateWorkingPeriod(joinDate: Date) {
    const now = new Date();

    if (joinDate > now) {
      throw new BadRequestException('joinDate tidak boleh melebihi hari ini');
    }

    let years = now.getFullYear() - joinDate.getFullYear();
    let months = now.getMonth() - joinDate.getMonth();

    if (now.getDate() < joinDate.getDate()) {
      months -= 1;
    }

    if (months < 0) {
      years -= 1;
      months += 12;
    }

    return `${years} years ${months} months`;
  }

  private getRetirementAge(type?: EmployeeType | string) {
    // Aturan yayasan: guru pensiun 60 tahun, pegawai pensiun 56 tahun.
    if (type === EmployeeType.GURU) {
      return 60;
    }

    if (type === EmployeeType.PEGAWAI) {
      return 56;
    }

    return undefined;
  }

  private calculateRetirementDate(birthDate: Date, retirementAge: number) {
    const retirementDate = new Date(birthDate);
    retirementDate.setFullYear(retirementDate.getFullYear() + retirementAge);

    return retirementDate;
  }

  private async ensureSchoolExists(schoolId: string) {
    const school = await this.prisma.school.findUnique({
      where: { id: schoolId },
      select: { id: true },
    });

    if (!school) {
      throw new NotFoundException('Sekolah tidak ditemukan');
    }
  }

  private async ensureSchoolCanEdit(schoolId: string, user: AuthUser) {
    if (user.role !== Role.SCHOOL) {
      return;
    }

    const school = await this.prisma.school.findUnique({
      where: { id: schoolId },
      select: { canEdit: true },
    });

    if (!school?.canEdit) {
      throw new ForbiddenException('Akses edit sekolah sedang dikunci owner');
    }
  }
}
