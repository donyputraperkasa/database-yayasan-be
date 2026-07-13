import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { Role } from '../common/enums/role.enum';
import { AuthUser } from '../common/types/auth-user.type';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateSchoolProfileDto } from './dto/update-school-profile.dto';

@Injectable()
export class SchoolProfileService {
  constructor(
    private readonly auditLogsService: AuditLogsService,
    private readonly prisma: PrismaService,
  ) {}

  async findBySchoolId(schoolId: string, user: AuthUser) {
    this.ensureCanAccessSchool(schoolId, user);
    await this.ensureSchoolExists(schoolId);

    return this.prisma.schoolProfile.findUnique({
      where: { schoolId },
    });
  }

  async upsertBySchoolId(
    schoolId: string,
    dto: UpdateSchoolProfileDto,
    user: AuthUser,
  ) {
    this.ensureCanManageSchoolProfile(schoolId, user);
    await this.ensureSchoolExists(schoolId);
    await this.ensureSchoolCanEdit(schoolId, user);

    const profile = await this.prisma.schoolProfile.upsert({
      where: { schoolId },
      create: {
        schoolId,
        ...dto,
      },
      update: dto,
    });
    await this.auditLogsService.create({
      action: 'upsert',
      description: 'Mengubah profil sekolah',
      entity: 'school_profiles',
      entityId: profile.id,
      schoolId: profile.schoolId,
      user,
    });

    return profile;
  }

  async uploadPhoto(schoolId: string, photoUrl: string, user: AuthUser) {
    this.ensureCanManageSchoolProfile(schoolId, user);
    await this.ensureSchoolExists(schoolId);
    await this.ensureSchoolCanEdit(schoolId, user);

    const profile = await this.prisma.schoolProfile.upsert({
      where: { schoolId },
      create: { schoolId, photoUrl },
      update: { photoUrl },
    });
    await this.auditLogsService.create({
      action: 'upload_photo',
      description: 'Mengunggah foto profil sekolah',
      entity: 'school_profiles',
      entityId: profile.id,
      schoolId: profile.schoolId,
      user,
    });

    return profile;
  }

  private ensureCanAccessSchool(schoolId: string, user: AuthUser) {
    if (user.role !== Role.SCHOOL) {
      return;
    }

    if (!user.schoolId || user.schoolId !== schoolId) {
      throw new ForbiddenException('Tidak bisa mengakses sekolah lain');
    }
  }

  private ensureCanManageSchoolProfile(schoolId: string, user: AuthUser) {
    if (user.role === Role.OWNER) {
      return;
    }

    if (user.role === Role.SCHOOL && user.schoolId === schoolId) {
      return;
    }

    throw new ForbiddenException('Tidak bisa mengubah profil sekolah ini');
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
