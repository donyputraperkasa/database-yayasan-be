import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '../common/enums/role.enum';
import { AuthUser } from '../common/types/auth-user.type';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateDocumentDto,
  UpdateDocumentDto,
} from './dto/create-document.dto';

@Injectable()
export class DocumentsService {
  constructor(private readonly prisma: PrismaService) {}

  async upload(dto: CreateDocumentDto, fileUrl: string, user: AuthUser) {
    const schoolId = this.resolveWritableSchoolId(dto.schoolId, user);
    await this.ensureSchoolExists(schoolId);
    await this.ensureSchoolCanEdit(schoolId, user);

    return this.prisma.document.create({
      data: {
        schoolId,
        name: dto.name,
        fileUrl,
      },
      include: {
        school: true,
      },
    });
  }

  async findAll(user: AuthUser, schoolId?: string) {
    const resolvedSchoolId = this.resolveReadableSchoolId(user, schoolId);

    return this.prisma.document.findMany({
      where: {
        schoolId: resolvedSchoolId,
      },
      include: {
        school: true,
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findById(id: string, user: AuthUser) {
    const document = await this.prisma.document.findUnique({
      where: { id },
      include: {
        school: true,
      },
    });

    if (!document) {
      throw new NotFoundException('Dokumen tidak ditemukan');
    }

    this.ensureCanAccessDocument(document.schoolId, user);

    return document;
  }

  async update(id: string, dto: UpdateDocumentDto, user: AuthUser) {
    const document = await this.findDocumentOrThrow(id);
    this.ensureCanManageDocument(document.schoolId, user);
    await this.ensureSchoolCanEdit(document.schoolId, user);

    const { schoolId, ...data } = dto;
    const nextSchoolId =
      user.role === Role.OWNER && schoolId ? schoolId : document.schoolId;

    if (user.role === Role.OWNER && schoolId) {
      await this.ensureSchoolExists(schoolId);
    }

    return this.prisma.document.update({
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
    const document = await this.findDocumentOrThrow(id);
    this.ensureCanManageDocument(document.schoolId, user);
    await this.ensureSchoolCanEdit(document.schoolId, user);

    return this.prisma.document.delete({
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

  private ensureCanAccessDocument(schoolId: string, user: AuthUser) {
    if (user.role !== Role.SCHOOL) {
      return;
    }

    if (!user.schoolId || user.schoolId !== schoolId) {
      throw new ForbiddenException('Tidak bisa mengakses dokumen sekolah lain');
    }
  }

  private ensureCanManageDocument(schoolId: string, user: AuthUser) {
    if (user.role === Role.OWNER) {
      return;
    }

    if (user.role === Role.SCHOOL && user.schoolId === schoolId) {
      return;
    }

    throw new ForbiddenException('Tidak bisa mengubah dokumen ini');
  }

  private async findDocumentOrThrow(id: string) {
    const document = await this.prisma.document.findUnique({
      where: { id },
      select: { id: true, schoolId: true },
    });

    if (!document) {
      throw new NotFoundException('Dokumen tidak ditemukan');
    }

    return document;
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
