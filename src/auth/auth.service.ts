import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { BootstrapOwnerDto } from './dto/bootstrap-owner.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);

    if (!user) {
      throw new UnauthorizedException('Email atau password salah');
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

  bootstrapOwner(dto: BootstrapOwnerDto) {
    return this.usersService.createBootstrapOwner(dto);
  }

  changePassword(userId: string, dto: ChangePasswordDto) {
    return this.usersService.changePassword(userId, dto);
  }
}
