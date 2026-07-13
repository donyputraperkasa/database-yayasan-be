import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { Role } from '../common/enums/role.enum';
import { AuthUser } from '../common/types/auth-user.type';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSchoolDto } from './dto/create-school.dto';
import { UpdateSchoolDto } from './dto/update-school.dto';

@Injectable()
export class SchoolsService {
  constructor(
    private readonly auditLogsService: AuditLogsService,
    private readonly prisma: PrismaService,
  ) {}

  async create(dto: CreateSchoolDto, user: AuthUser) {
    const school = await this.prisma.school.create({
      data: dto,
    });
    await this.auditLogsService.create({
      action: 'create',
      description: `Menambahkan sekolah ${school.name}`,
      entity: 'schools',
      entityId: school.id,
      schoolId: school.id,
      user,
    });

    return school;
  }

  async findAll(user: AuthUser) {
    if (user.role === Role.SCHOOL) {
      if (!user.schoolId) {
        throw new ForbiddenException('User school belum terhubung ke sekolah');
      }

      return this.prisma.school.findMany({
        where: { archivedAt: null, id: user.schoolId },
        include: { profile: true },
        orderBy: { createdAt: 'desc' },
      });
    }

    return this.prisma.school.findMany({
      where: { archivedAt: null },
      include: { profile: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string, user: AuthUser) {
    this.ensureCanAccessSchool(id, user);

    const school = await this.prisma.school.findFirst({
      where: { archivedAt: null, id },
      include: {
        profile: true,
        _count: {
          select: {
            users: true,
            employees: true,
            students: true,
            assets: true,
            facilities: true,
            finances: true,
            documents: true,
          },
        },
      },
    });

    if (!school) {
      throw new NotFoundException('Sekolah tidak ditemukan');
    }

    return school;
  }

  async update(id: string, dto: UpdateSchoolDto, user: AuthUser) {
    this.ensureCanManageSchool(id, user);
    await this.ensureSchoolExists(id);
    await this.ensureSchoolCanEdit(id, user);

    const school = await this.prisma.school.update({
      where: { id },
      data: dto,
      include: { profile: true },
    });
    await this.auditLogsService.create({
      action: 'update',
      description: `Mengubah data sekolah ${school.name}`,
      entity: 'schools',
      entityId: school.id,
      schoolId: school.id,
      user,
    });

    return school;
  }

  async updateEditAccess(id: string, canEdit: boolean, user: AuthUser) {
    await this.ensureSchoolExists(id);

    const school = await this.prisma.school.update({
      where: { id },
      data: { canEdit },
    });
    await this.auditLogsService.create({
      action: canEdit ? 'open_edit_access' : 'close_edit_access',
      description: `${canEdit ? 'Membuka' : 'Mengunci'} akses edit ${school.name}`,
      entity: 'schools',
      entityId: school.id,
      schoolId: school.id,
      user,
    });

    return school;
  }

  async remove(id: string, user: AuthUser) {
    const school = await this.ensureSchoolExists(id);

    const [archivedSchool] = await this.prisma.$transaction([
      this.prisma.school.update({
        where: { id },
        data: { archivedAt: new Date(), canEdit: false },
      }),
      this.prisma.user.updateMany({
        where: { schoolId: id },
        data: { activeSessionId: null },
      }),
    ]);
    await this.auditLogsService.create({
      action: 'archive',
      description: `Mengarsipkan sekolah ${school.name}`,
      entity: 'schools',
      entityId: id,
      schoolId: id,
      user,
    });

    return archivedSchool;
  }

  findArchived() {
    return this.prisma.school.findMany({
      where: { archivedAt: { not: null } },
      include: { profile: true },
      orderBy: { archivedAt: 'desc' },
    });
  }

  async restore(id: string, user: AuthUser) {
    const school = await this.prisma.school.findFirst({
      where: { archivedAt: { not: null }, id },
    });

    if (!school) throw new NotFoundException('Arsip sekolah tidak ditemukan');
    const restoredSchool = await this.prisma.school.update({
      where: { id },
      data: { archivedAt: null },
    });
    await this.auditLogsService.create({
      action: 'restore',
      description: `Memulihkan sekolah ${school.name}`,
      entity: 'schools',
      entityId: id,
      schoolId: id,
      user,
    });

    return restoredSchool;
  }

  private ensureCanAccessSchool(id: string, user: AuthUser) {
    if (user.role !== Role.SCHOOL) {
      return;
    }

    if (!user.schoolId || user.schoolId !== id) {
      throw new ForbiddenException('Tidak bisa mengakses sekolah lain');
    }
  }

  private ensureCanManageSchool(id: string, user: AuthUser) {
    if (user.role === Role.OWNER) {
      return;
    }

    if (user.role === Role.SCHOOL && user.schoolId === id) {
      return;
    }

    throw new ForbiddenException('Tidak bisa mengubah sekolah ini');
  }

  private async ensureSchoolExists(id: string) {
    const school = await this.prisma.school.findFirst({
      where: { archivedAt: null, id },
      select: { id: true, name: true },
    });

    if (!school) {
      throw new NotFoundException('Sekolah tidak ditemukan');
    }

    return school;
  }

  private async ensureSchoolCanEdit(id: string, user: AuthUser) {
    if (user.role !== Role.SCHOOL) {
      return;
    }

    const school = await this.prisma.school.findUnique({
      where: { id },
      select: { canEdit: true },
    });

    if (!school?.canEdit) {
      throw new ForbiddenException('Akses edit sekolah sedang dikunci owner');
    }
  }
}
