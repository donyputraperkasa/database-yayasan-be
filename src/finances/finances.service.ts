import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { FinanceType, Role } from '../common/enums/role.enum';
import { AuthUser } from '../common/types/auth-user.type';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFinanceDto } from './dto/create-finance.dto';
import { UpdateFinanceDto } from './dto/update-finance.dto';

@Injectable()
export class FinancesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateFinanceDto, user: AuthUser) {
    const schoolId = this.resolveWritableSchoolId(dto.schoolId, user);
    await this.ensureSchoolExists(schoolId);

    const data = { ...dto };
    const { date } = data;
    delete data.schoolId;
    delete data.date;

    return this.prisma.finance.create({
      data: {
        ...data,
        date: date ? new Date(date) : undefined,
        schoolId,
      },
      include: {
        school: true,
      },
    });
  }

  async findAll(
    user: AuthUser,
    schoolId?: string,
    type?: FinanceType,
    className?: string,
  ) {
    const resolvedSchoolId = this.resolveReadableSchoolId(user, schoolId);

    return this.prisma.finance.findMany({
      where: {
        schoolId: resolvedSchoolId,
        type,
        className,
      },
      include: {
        school: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string, user: AuthUser) {
    const finance = await this.prisma.finance.findUnique({
      where: { id },
      include: {
        school: true,
      },
    });

    if (!finance) {
      throw new NotFoundException('Data keuangan tidak ditemukan');
    }

    this.ensureCanAccessFinance(finance.schoolId, user);

    return finance;
  }

  async update(id: string, dto: UpdateFinanceDto, user: AuthUser) {
    const finance = await this.findFinanceOrThrow(id);
    this.ensureCanManageFinance(finance.schoolId, user);

    const { schoolId, date, ...data } = dto;
    const nextSchoolId =
      user.role === Role.OWNER && schoolId ? schoolId : finance.schoolId;

    if (user.role === Role.OWNER && schoolId) {
      await this.ensureSchoolExists(schoolId);
    }

    return this.prisma.finance.update({
      where: { id },
      data: {
        ...data,
        date: date ? new Date(date) : undefined,
        schoolId: nextSchoolId,
      },
      include: {
        school: true,
      },
    });
  }

  async remove(id: string, user: AuthUser) {
    const finance = await this.findFinanceOrThrow(id);
    this.ensureCanManageFinance(finance.schoolId, user);

    return this.prisma.finance.delete({
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

  private ensureCanAccessFinance(schoolId: string, user: AuthUser) {
    if (user.role !== Role.SCHOOL) {
      return;
    }

    if (!user.schoolId || user.schoolId !== schoolId) {
      throw new ForbiddenException(
        'Tidak bisa mengakses data keuangan sekolah lain',
      );
    }
  }

  private ensureCanManageFinance(schoolId: string, user: AuthUser) {
    if (user.role === Role.OWNER) {
      return;
    }

    if (user.role === Role.SCHOOL && user.schoolId === schoolId) {
      return;
    }

    throw new ForbiddenException('Tidak bisa mengubah data keuangan ini');
  }

  private async findFinanceOrThrow(id: string) {
    const finance = await this.prisma.finance.findUnique({
      where: { id },
      select: { id: true, schoolId: true },
    });

    if (!finance) {
      throw new NotFoundException('Data keuangan tidak ditemukan');
    }

    return finance;
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
