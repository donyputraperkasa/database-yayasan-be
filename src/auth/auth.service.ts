import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { timingSafeEqual } from 'crypto';
import { AuthUser } from '../common/types/auth-user.type';
import { UsersService } from '../users/users.service';
import { BootstrapOwnerDto } from './dto/bootstrap-owner.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);

    if (!user) {
      throw new UnauthorizedException('Email atau password salah');
    }

    if (user.school?.archivedAt) {
      throw new UnauthorizedException('Akun sekolah sudah dinonaktifkan');
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new UnauthorizedException(
        'Ehhh cieee gagal login 3x, tunggu beberapa menit lagi yaa',
      );
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);

    if (!isPasswordValid) {
      await this.usersService.registerLoginFailure(user);
      throw new UnauthorizedException('Email atau password salah');
    }

    const sessionId = await this.usersService.registerLoginSuccess(user);

    // Payload JWT dibuat minimal: cukup untuk identitas, role, dan pembatasan schoolId.
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      schoolId: user.schoolId,
      sessionId,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    // Data sensitif seperti password tidak dikirim kembali setelah login.
    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      schoolId: user.schoolId,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    return {
      accessToken,
      user: safeUser,
    };
  }

  bootstrapOwner(dto: BootstrapOwnerDto, receivedSecret?: string) {
    const configuredSecret = this.configService.get<string>(
      'BOOTSTRAP_OWNER_SECRET',
    );

    if (!this.isBootstrapSecretValid(receivedSecret, configuredSecret)) {
      throw new ForbiddenException('Bootstrap owner tidak tersedia');
    }

    return this.usersService.createBootstrapOwner(dto);
  }

  changePassword(userId: string, dto: ChangePasswordDto) {
    return this.usersService.changePassword(userId, dto);
  }

  logout(user: AuthUser) {
    return this.usersService.logout(user);
  }

  private isBootstrapSecretValid(received?: string, configured?: string) {
    if (!received || !configured) return false;
    const receivedBuffer = Buffer.from(received);
    const configuredBuffer = Buffer.from(configured);

    return (
      receivedBuffer.length === configuredBuffer.length &&
      timingSafeEqual(receivedBuffer, configuredBuffer)
    );
  }
}
