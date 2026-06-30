import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '../common/enums/role.enum';
import { AuthUser } from '../common/types/auth-user.type';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateSchoolProfileDto } from './dto/update-school-profile.dto';

@Injectable()
export class SchoolProfileService {
  constructor(private readonly prisma: PrismaService) {}

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

    return this.prisma.schoolProfile.upsert({
      where: { schoolId },
      create: {
        schoolId,
        ...dto,
      },
      update: dto,
    });
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
    const school = await this.prisma.school.findUnique({
      where: { id: schoolId },
      select: { id: true },
    });

    if (!school) {
      throw new NotFoundException('Sekolah tidak ditemukan');
    }
  }
}
