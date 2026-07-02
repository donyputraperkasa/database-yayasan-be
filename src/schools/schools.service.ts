import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '../common/enums/role.enum';
import { AuthUser } from '../common/types/auth-user.type';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSchoolDto } from './dto/create-school.dto';
import { UpdateSchoolDto } from './dto/update-school.dto';

@Injectable()
export class SchoolsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateSchoolDto) {
    return this.prisma.school.create({
      data: dto,
    });
  }

  async findAll(user: AuthUser) {
    if (user.role === Role.SCHOOL) {
      if (!user.schoolId) {
        throw new ForbiddenException('User school belum terhubung ke sekolah');
      }

      return this.prisma.school.findMany({
        where: { id: user.schoolId },
        orderBy: { createdAt: 'desc' },
      });
    }

    return this.prisma.school.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string, user: AuthUser) {
    this.ensureCanAccessSchool(id, user);

    const school = await this.prisma.school.findUnique({
      where: { id },
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

  async update(id: string, dto: UpdateSchoolDto) {
    await this.ensureSchoolExists(id);

    return this.prisma.school.update({
      where: { id },
      data: dto,
    });
  }

  async updateEditAccess(id: string, canEdit: boolean) {
    await this.ensureSchoolExists(id);

    return this.prisma.school.update({
      where: { id },
      data: { canEdit },
    });
  }

  async remove(id: string) {
    await this.ensureSchoolExists(id);

    return this.prisma.school.delete({
      where: { id },
    });
  }

  private ensureCanAccessSchool(id: string, user: AuthUser) {
    if (user.role !== Role.SCHOOL) {
      return;
    }

    if (!user.schoolId || user.schoolId !== id) {
      throw new ForbiddenException('Tidak bisa mengakses sekolah lain');
    }
  }

  private async ensureSchoolExists(id: string) {
    const school = await this.prisma.school.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!school) {
      throw new NotFoundException('Sekolah tidak ditemukan');
    }
  }
}
