import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { FacilityCondition, Role } from '../common/enums/role.enum';
import { AuthUser } from '../common/types/auth-user.type';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFacilityDto } from './dto/create-facility.dto';
import { UpdateFacilityDto } from './dto/update-facility.dto';

@Injectable()
export class FacilitiesService {
  constructor(
    private readonly auditLogsService: AuditLogsService,
    private readonly prisma: PrismaService,
  ) {}

  async create(dto: CreateFacilityDto, user: AuthUser) {
    const schoolId = this.resolveWritableSchoolId(dto.schoolId, user);
    await this.ensureSchoolExists(schoolId);
    await this.ensureSchoolCanEdit(schoolId, user);

    const data = { ...dto };
    delete data.schoolId;

    const facility = await this.prisma.facility.create({
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
      description: `Menambahkan fasilitas ${facility.name}`,
      entity: 'facilities',
      entityId: facility.id,
      schoolId: facility.schoolId,
      user,
    });

    return facility;
  }

  async findAll(
    user: AuthUser,
    schoolId?: string,
    condition?: FacilityCondition,
  ) {
    const resolvedSchoolId = this.resolveReadableSchoolId(user, schoolId);

    return this.prisma.facility.findMany({
      where: {
        schoolId: resolvedSchoolId,
        condition,
      },
      include: {
        school: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string, user: AuthUser) {
    const facility = await this.prisma.facility.findUnique({
      where: { id },
      include: {
        school: true,
      },
    });

    if (!facility) {
      throw new NotFoundException('Sarana prasarana tidak ditemukan');
    }

    this.ensureCanAccessFacility(facility.schoolId, user);

    return facility;
  }

  async update(id: string, dto: UpdateFacilityDto, user: AuthUser) {
    const facility = await this.findFacilityOrThrow(id);
    this.ensureCanManageFacility(facility.schoolId, user);
    await this.ensureSchoolCanEdit(facility.schoolId, user);

    const { schoolId, ...data } = dto;
    const nextSchoolId =
      user.role === Role.OWNER && schoolId ? schoolId : facility.schoolId;

    if (user.role === Role.OWNER && schoolId) {
      await this.ensureSchoolExists(schoolId);
    }

    const updatedFacility = await this.prisma.facility.update({
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
      description: `Mengubah fasilitas ${updatedFacility.name}`,
      entity: 'facilities',
      entityId: updatedFacility.id,
      schoolId: updatedFacility.schoolId,
      user,
    });

    return updatedFacility;
  }

  async remove(id: string, user: AuthUser) {
    const facility = await this.findFacilityOrThrow(id);
    this.ensureCanManageFacility(facility.schoolId, user);
    await this.ensureSchoolCanEdit(facility.schoolId, user);

    const deletedFacility = await this.prisma.facility.delete({
      where: { id },
    });
    await this.auditLogsService.create({
      action: 'delete',
      description: `Menghapus fasilitas ${deletedFacility.name}`,
      entity: 'facilities',
      entityId: deletedFacility.id,
      schoolId: deletedFacility.schoolId,
      user,
    });

    return deletedFacility;
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

  private ensureCanAccessFacility(schoolId: string, user: AuthUser) {
    if (user.role !== Role.SCHOOL) {
      return;
    }

    if (!user.schoolId || user.schoolId !== schoolId) {
      throw new ForbiddenException('Tidak bisa mengakses sarpras sekolah lain');
    }
  }

  private ensureCanManageFacility(schoolId: string, user: AuthUser) {
    if (user.role === Role.OWNER) {
      return;
    }

    if (user.role === Role.SCHOOL && user.schoolId === schoolId) {
      return;
    }

    throw new ForbiddenException('Tidak bisa mengubah sarpras ini');
  }

  private async findFacilityOrThrow(id: string) {
    const facility = await this.prisma.facility.findUnique({
      where: { id },
      select: { id: true, schoolId: true },
    });

    if (!facility) {
      throw new NotFoundException('Sarana prasarana tidak ditemukan');
    }

    return facility;
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
