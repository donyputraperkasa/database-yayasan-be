import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '../common/enums/role.enum';
import { AuthUser } from '../common/types/auth-user.type';
import { PrismaService } from '../prisma/prisma.service';
import { CreateContactDto } from './dto/create-contact.dto';

@Injectable()
export class ContactsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateContactDto, user: AuthUser) {
    const schoolId = this.resolveSchoolId(dto.schoolId, user);

    if (schoolId) {
      await this.ensureSchoolExists(schoolId);
    }

    return this.prisma.contact.create({
      data: {
        ...dto,
        schoolId,
      },
      include: {
        school: true,
      },
    });
  }

  async findAll(user: AuthUser, schoolId?: string) {
    if (user.role === Role.SCHOOL) {
      if (!user.schoolId) {
        throw new ForbiddenException('User school belum terhubung ke sekolah');
      }

      schoolId = user.schoolId;
    }

    return this.prisma.contact.findMany({
      where: { schoolId },
      include: {
        school: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string, user: AuthUser) {
    const contact = await this.prisma.contact.findUnique({
      where: { id },
      include: {
        school: true,
      },
    });

    if (!contact) {
      throw new NotFoundException('Pesan kontak tidak ditemukan');
    }

    if (
      user.role === Role.SCHOOL &&
      (!user.schoolId || user.schoolId !== contact.schoolId)
    ) {
      throw new ForbiddenException('Tidak bisa mengakses pesan sekolah lain');
    }

    return contact;
  }

  async remove(id: string) {
    await this.findContactOrThrow(id);

    return this.prisma.contact.delete({
      where: { id },
    });
  }

  private resolveSchoolId(schoolId: string | undefined, user: AuthUser) {
    if (user.role === Role.SCHOOL) {
      if (!user.schoolId) {
        throw new ForbiddenException('User school belum terhubung ke sekolah');
      }

      return user.schoolId;
    }

    return schoolId;
  }

  private async findContactOrThrow(id: string) {
    const contact = await this.prisma.contact.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!contact) {
      throw new NotFoundException('Pesan kontak tidak ditemukan');
    }
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
