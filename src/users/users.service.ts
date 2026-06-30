import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Role } from '../common/enums/role.enum';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateUserDto) {
    if (dto.role === Role.SCHOOL && !dto.schoolId) {
      throw new BadRequestException('schoolId wajib diisi untuk role school');
    }

    if (dto.role !== Role.SCHOOL && dto.schoolId) {
      throw new BadRequestException(
        'schoolId hanya boleh diisi untuk role school',
      );
    }

    if (dto.schoolId) {
      const school = await this.prisma.school.findUnique({
        where: { id: dto.schoolId },
      });

      if (!school) {
        throw new NotFoundException('Sekolah tidak ditemukan');
      }
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email sudah digunakan');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        password: hashedPassword,
        role: dto.role,
        schoolId: dto.schoolId,
      },
    });

    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      schoolId: user.schoolId,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
    return safeUser;
  }

  async createBootstrapOwner(
    dto: Pick<CreateUserDto, 'name' | 'email' | 'password'>,
  ) {
    const userCount = await this.prisma.user.count();

    if (userCount > 0) {
      throw new ConflictException('Bootstrap owner sudah tidak tersedia');
    }

    return this.create({
      ...dto,
      role: Role.OWNER,
    });
  }

  async findAll() {
    return this.prisma.user.findMany({
      omit: { password: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      omit: { password: true },
    });

    if (!user) {
      throw new NotFoundException('User tidak ditemukan');
    }

    return user;
  }
}
