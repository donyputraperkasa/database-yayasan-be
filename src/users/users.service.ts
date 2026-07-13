import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { Role } from '../common/enums/role.enum';
import { AuthUser } from '../common/types/auth-user.type';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Injectable()
export class UsersService {
  private readonly lockDurationMs = 15 * 60 * 1000;

  constructor(
    private readonly auditLogsService: AuditLogsService,
    private readonly prisma: PrismaService,
  ) {}

  async create(dto: CreateUserDto, actor?: AuthUser) {
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
      const school = await this.prisma.school.findFirst({
        where: { archivedAt: null, id: dto.schoolId },
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
    await this.auditLogsService.create({
      action: 'create',
      description: `Membuat akun ${user.email} dengan role ${user.role}`,
      entity: 'users',
      entityId: user.id,
      schoolId: user.schoolId,
      user: actor,
    });
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

  async resetPassword(id: string, dto: ResetPasswordDto, actor?: AuthUser) {
    const user = await this.findById(id);
    await this.updatePassword(id, dto.newPassword);
    await this.auditLogsService.create({
      action: 'reset_password',
      description: `Reset password akun ${user.email}`,
      entity: 'users',
      entityId: id,
      schoolId: user.schoolId,
      user: actor,
    });

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
      include: {
        school: {
          select: { archivedAt: true },
        },
      },
    });
  }

  async logout(user: AuthUser) {
    await this.prisma.user.update({
      where: { id: user.sub },
      data: { activeSessionId: null },
    });
    await this.auditLogsService.create({
      action: 'logout',
      description: `Logout akun ${user.email}`,
      entity: 'auth',
      entityId: user.sub,
      schoolId: user.schoolId,
      user,
    });
  }

  async registerLoginFailure(user: {
    id: string;
    email: string;
    failedLoginAttempts: number;
    lockedUntil?: Date | null;
    role: string;
    schoolId?: string | null;
  }) {
    const previousLockExpired =
      user.lockedUntil !== null &&
      user.lockedUntil !== undefined &&
      user.lockedUntil <= new Date();
    const failedLoginAttempts = previousLockExpired
      ? 1
      : user.failedLoginAttempts + 1;
    const lockedUntil =
      failedLoginAttempts >= 3
        ? new Date(Date.now() + this.lockDurationMs)
        : null;

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts,
        lockedUntil,
      },
    });
    await this.auditLogsService.create({
      action: lockedUntil ? 'lock_account' : 'login_failed',
      description: lockedUntil
        ? `Akun ${user.email} terkunci karena 3 kali gagal login`
        : `Login gagal untuk akun ${user.email}`,
      entity: 'auth',
      entityId: user.id,
      schoolId: user.schoolId,
      user: {
        email: user.email,
        role: user.role as Role,
        schoolId: user.schoolId,
        sub: user.id,
      },
    });

    return { failedLoginAttempts, lockedUntil };
  }

  async registerLoginSuccess(user: {
    id: string;
    email: string;
    role: string;
    schoolId?: string | null;
  }) {
    const activeSessionId = randomUUID();

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        activeSessionId,
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });
    await this.auditLogsService.create({
      action: 'login_success',
      description: `Login berhasil untuk akun ${user.email}`,
      entity: 'auth',
      entityId: user.id,
      schoolId: user.schoolId,
      user: {
        email: user.email,
        role: user.role as Role,
        schoolId: user.schoolId,
        sub: user.id,
        sessionId: activeSessionId,
      },
    });

    return activeSessionId;
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
      data: {
        activeSessionId: null,
        failedLoginAttempts: 0,
        lockedUntil: null,
        password: hashedPassword,
      },
      omit: { password: true },
    });
  }
}
