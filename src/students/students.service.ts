import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '../common/enums/role.enum';
import { AuthUser } from '../common/types/auth-user.type';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';

@Injectable()
export class StudentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateStudentDto, user: AuthUser) {
    const schoolId = this.resolveWritableSchoolId(dto.schoolId, user);
    await this.ensureSchoolExists(schoolId);

    const data = { ...dto };
    delete data.schoolId;

    return this.prisma.student.create({
      data: {
        ...data,
        schoolId,
      },
      include: {
        school: true,
      },
    });
  }

  async findAll(user: AuthUser, schoolId?: string, className?: string) {
    const resolvedSchoolId = this.resolveReadableSchoolId(user, schoolId);

    return this.prisma.student.findMany({
      where: {
        schoolId: resolvedSchoolId,
        className,
      },
      include: {
        school: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string, user: AuthUser) {
    const student = await this.prisma.student.findUnique({
      where: { id },
      include: {
        school: true,
      },
    });

    if (!student) {
      throw new NotFoundException('Siswa tidak ditemukan');
    }

    this.ensureCanAccessStudent(student.schoolId, user);

    return student;
  }

  async update(id: string, dto: UpdateStudentDto, user: AuthUser) {
    const student = await this.findStudentOrThrow(id);
    this.ensureCanManageStudent(student.schoolId, user);

    const { schoolId, ...data } = dto;
    const nextSchoolId =
      user.role === Role.OWNER && schoolId ? schoolId : student.schoolId;

    if (user.role === Role.OWNER && schoolId) {
      await this.ensureSchoolExists(schoolId);
    }

    return this.prisma.student.update({
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
    const student = await this.findStudentOrThrow(id);
    this.ensureCanManageStudent(student.schoolId, user);

    return this.prisma.student.delete({
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

  private ensureCanAccessStudent(schoolId: string, user: AuthUser) {
    if (user.role !== Role.SCHOOL) {
      return;
    }

    if (!user.schoolId || user.schoolId !== schoolId) {
      throw new ForbiddenException('Tidak bisa mengakses siswa sekolah lain');
    }
  }

  private ensureCanManageStudent(schoolId: string, user: AuthUser) {
    if (user.role === Role.OWNER) {
      return;
    }

    if (user.role === Role.SCHOOL && user.schoolId === schoolId) {
      return;
    }

    throw new ForbiddenException('Tidak bisa mengubah siswa ini');
  }

  private async findStudentOrThrow(id: string) {
    const student = await this.prisma.student.findUnique({
      where: { id },
      select: { id: true, schoolId: true },
    });

    if (!student) {
      throw new NotFoundException('Siswa tidak ditemukan');
    }

    return student;
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
