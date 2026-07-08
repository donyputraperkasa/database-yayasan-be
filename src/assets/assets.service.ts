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
import { CreateAssetDto } from './dto/create-asset.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';

@Injectable()
export class AssetsService {
  constructor(
    private readonly auditLogsService: AuditLogsService,
    private readonly prisma: PrismaService,
  ) {}

  async create(dto: CreateAssetDto, user: AuthUser) {
    const schoolId = this.resolveWritableSchoolId(dto.schoolId, user);
    await this.ensureSchoolExists(schoolId);
    await this.ensureSchoolCanEdit(schoolId, user);

    const data = { ...dto };
    delete data.schoolId;

    const asset = await this.prisma.schoolAsset.create({
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
      description: `Menambahkan aset sekolah ${asset.school.name}`,
      entity: 'assets',
      entityId: asset.id,
      schoolId: asset.schoolId,
      user,
    });

    return asset;
  }

  async findAll(user: AuthUser, schoolId?: string) {
    const resolvedSchoolId = this.resolveReadableSchoolId(user, schoolId);

    return this.prisma.schoolAsset.findMany({
      where: {
        schoolId: resolvedSchoolId,
      },
      include: {
        school: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string, user: AuthUser) {
    const asset = await this.prisma.schoolAsset.findUnique({
      where: { id },
      include: {
        school: true,
      },
    });

    if (!asset) {
      throw new NotFoundException('Aset sekolah tidak ditemukan');
    }

    this.ensureCanAccessAsset(asset.schoolId, user);

    return asset;
  }

  async update(id: string, dto: UpdateAssetDto, user: AuthUser) {
    const asset = await this.findAssetOrThrow(id);
    this.ensureCanManageAsset(asset.schoolId, user);
    await this.ensureSchoolCanEdit(asset.schoolId, user);

    const { schoolId, ...data } = dto;
    const nextSchoolId =
      user.role === Role.OWNER && schoolId ? schoolId : asset.schoolId;

    if (user.role === Role.OWNER && schoolId) {
      await this.ensureSchoolExists(schoolId);
    }

    const updatedAsset = await this.prisma.schoolAsset.update({
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
      description: `Mengubah aset sekolah ${updatedAsset.school.name}`,
      entity: 'assets',
      entityId: updatedAsset.id,
      schoolId: updatedAsset.schoolId,
      user,
    });

    return updatedAsset;
  }

  async remove(id: string, user: AuthUser) {
    const asset = await this.findAssetOrThrow(id);
    this.ensureCanManageAsset(asset.schoolId, user);
    await this.ensureSchoolCanEdit(asset.schoolId, user);

    const deletedAsset = await this.prisma.schoolAsset.delete({
      where: { id },
    });
    await this.auditLogsService.create({
      action: 'delete',
      description: 'Menghapus aset sekolah',
      entity: 'assets',
      entityId: deletedAsset.id,
      schoolId: deletedAsset.schoolId,
      user,
    });

    return deletedAsset;
  }

  async uploadPhoto(id: string, photoUrl: string, user: AuthUser) {
    const asset = await this.findAssetOrThrow(id);
    this.ensureCanManageAsset(asset.schoolId, user);
    await this.ensureSchoolCanEdit(asset.schoolId, user);

    const updatedAsset = await this.prisma.schoolAsset.update({
      where: { id },
      data: { photoUrl },
      include: {
        school: true,
      },
    });
    await this.auditLogsService.create({
      action: 'upload_photo',
      description: `Mengunggah foto aset sekolah ${updatedAsset.school.name}`,
      entity: 'assets',
      entityId: updatedAsset.id,
      schoolId: updatedAsset.schoolId,
      user,
    });

    return updatedAsset;
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

  private ensureCanAccessAsset(schoolId: string, user: AuthUser) {
    if (user.role !== Role.SCHOOL) {
      return;
    }

    if (!user.schoolId || user.schoolId !== schoolId) {
      throw new ForbiddenException('Tidak bisa mengakses aset sekolah lain');
    }
  }

  private ensureCanManageAsset(schoolId: string, user: AuthUser) {
    if (user.role === Role.OWNER) {
      return;
    }

    if (user.role === Role.SCHOOL && user.schoolId === schoolId) {
      return;
    }

    throw new ForbiddenException('Tidak bisa mengubah aset ini');
  }

  private async findAssetOrThrow(id: string) {
    const asset = await this.prisma.schoolAsset.findUnique({
      where: { id },
      select: { id: true, schoolId: true },
    });

    if (!asset) {
      throw new NotFoundException('Aset sekolah tidak ditemukan');
    }

    return asset;
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
