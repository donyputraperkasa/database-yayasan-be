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

@Injectable()
export class EmployeesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateEmployeeDto, user: AuthUser) {
    const schoolId = this.resolveWritableSchoolId(dto.schoolId, user);
    await this.ensureSchoolExists(schoolId);

    const data = { ...dto };
    delete data.schoolId;

    return this.prisma.employee.create({
      data: {
        ...data,
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

    const { schoolId, ...data } = dto;
    const nextSchoolId =
      user.role === Role.OWNER && schoolId ? schoolId : employee.schoolId;

    if (user.role === Role.OWNER && schoolId) {
      await this.ensureSchoolExists(schoolId);
    }

    return this.prisma.employee.update({
      where: { id },
      data: {
        ...data,
        schoolId: nextSchoolId,
      },
      include: {
        school: true,
      },
    });
  }

  async remove(id: string, user: AuthUser) {
    const employee = await this.findEmployeeOrThrow(id);
    this.ensureCanManageEmployee(employee.schoolId, user);

    return this.prisma.employee.delete({
      where: { id },
    });
  }

  private resolveWritableSchoolId(
    schoolId: string | undefined,
    user: AuthUser,
  ) {
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

  private async findEmployeeOrThrow(id: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { id },
      select: { id: true, schoolId: true },
    });

    if (!employee) {
      throw new NotFoundException('Employee tidak ditemukan');
    }

    return employee;
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
}
