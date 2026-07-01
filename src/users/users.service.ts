import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Role } from '../common/enums/role.enum';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateUserDto) {
    // Akun sekolah wajib terhubung ke satu sekolah, sedangkan owner/office bersifat level yayasan.
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

    // Password hanya disimpan dalam bentuk hash dan tidak pernah dikembalikan ke response.
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
    // Bootstrap owner hanya boleh dipakai saat database benar-benar belum memiliki user.
    const userCount = await this.prisma.user.count();

    if (userCount > 0) {
      throw new ConflictException('Bootstrap owner sudah tidak tersedia');
    }

    return this.create({
      ...dto,
      role: Role.OWNER,
    });
  }

  async changePassword(
    userId: string,
    dto: { oldPassword: string; newPassword: string },
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User tidak ditemukan');
    }

    const isOldPasswordValid = await bcrypt.compare(
      dto.oldPassword,
      user.password,
    );

    if (!isOldPasswordValid) {
      throw new UnauthorizedException('Password lama salah');
    }

    await this.updatePassword(user.id, dto.newPassword);

    return {
      message: 'Password berhasil diubah',
    };
  }

  async resetPassword(id: string, dto: ResetPasswordDto) {
    await this.findById(id);
    await this.updatePassword(id, dto.newPassword);

    return {
      message: 'Password berhasil direset',
    };
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

  private async updatePassword(id: string, password: string) {
    const hashedPassword = await bcrypt.hash(password, 10);

    return this.prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
      omit: { password: true },
    });
  }
}
