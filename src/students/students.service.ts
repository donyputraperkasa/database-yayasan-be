import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { Role } from '../common/enums/role.enum';
import { AuthUser } from '../common/types/auth-user.type';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';

@Injectable()
export class StudentsService {
  constructor(
    private readonly auditLogsService: AuditLogsService,
    private readonly prisma: PrismaService,
  ) {}

  async create(dto: CreateStudentDto, user: AuthUser) {
    const schoolId = this.resolveWritableSchoolId(dto.schoolId, user);
    await this.ensureSchoolExists(schoolId);
    await this.ensureSchoolCanEdit(schoolId, user);

    const data = { ...dto };
    delete data.schoolId;

    const student = await this.prisma.student.create({
      data: {
        ...data,
        schoolId,
      },
      include: {
        school: true,
      },
    });
    await this.auditLogsService.create({
      action: 'create',
      description: `Menambahkan siswa ${student.name}`,
      entity: 'students',
      entityId: student.id,
      schoolId: student.schoolId,
      user,
    });

    return student;
  }

  async findAll(user: AuthUser, schoolId?: string, className?: string) {
    const resolvedSchoolId = this.resolveReadableSchoolId(user, schoolId);

    return this.prisma.student.findMany({
      where: {
        schoolId: resolvedSchoolId,
        className,
        school: { archivedAt: null },
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
    await this.ensureSchoolCanEdit(student.schoolId, user);

    const { schoolId, ...data } = dto;
    const nextSchoolId =
      user.role === Role.OWNER && schoolId ? schoolId : student.schoolId;

    if (user.role === Role.OWNER && schoolId) {
      await this.ensureSchoolExists(schoolId);
    }

    const updatedStudent = await this.prisma.student.update({
      where: { id },
      data: {
        ...data,
        schoolId: nextSchoolId,
      },
      include: {
        school: true,
      },
    });
    await this.auditLogsService.create({
      action: 'update',
      description: `Mengubah data siswa ${updatedStudent.name}`,
      entity: 'students',
      entityId: updatedStudent.id,
      schoolId: updatedStudent.schoolId,
      user,
    });

    return updatedStudent;
  }

  async uploadPhoto(id: string, photoUrl: string, user: AuthUser) {
    const student = await this.findStudentOrThrow(id);
    this.ensureCanManageStudent(student.schoolId, user);
    await this.ensureSchoolCanEdit(student.schoolId, user);

    const updatedStudent = await this.prisma.student.update({
      where: { id },
      data: { photoUrl },
      include: {
        school: true,
      },
    });
    await this.auditLogsService.create({
      action: 'upload_photo',
      description: `Mengunggah foto siswa ${updatedStudent.name}`,
      entity: 'students',
      entityId: updatedStudent.id,
      schoolId: updatedStudent.schoolId,
      user,
    });

    return updatedStudent;
  }

  async remove(id: string, user: AuthUser) {
    const student = await this.findStudentOrThrow(id);
    this.ensureCanManageStudent(student.schoolId, user);
    await this.ensureSchoolCanEdit(student.schoolId, user);

    const deletedStudent = await this.prisma.student.delete({
      where: { id },
    });
    await this.auditLogsService.create({
      action: 'delete',
      description: `Menghapus siswa ${deletedStudent.name}`,
      entity: 'students',
      entityId: deletedStudent.id,
      schoolId: deletedStudent.schoolId,
      user,
    });

    return deletedStudent;
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
    const school = await this.prisma.school.findFirst({
      where: { archivedAt: null, id: schoolId },
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
