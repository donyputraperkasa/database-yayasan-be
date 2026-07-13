import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Role } from '../common/enums/role.enum';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';

type MockUsersService = {
  findByEmail: jest.Mock;
  createBootstrapOwner: jest.Mock;
  changePassword: jest.Mock;
  registerLoginFailure: jest.Mock;
  registerLoginSuccess: jest.Mock;
};

type MockJwtService = {
  signAsync: jest.Mock;
};

type MockConfigService = {
  get: jest.Mock;
};

describe('AuthService', () => {
  let service: AuthService;
  let usersService: MockUsersService;
  let jwtService: MockJwtService;
  let configService: MockConfigService;

  beforeEach(() => {
    usersService = {
      findByEmail: jest.fn(),
      createBootstrapOwner: jest.fn(),
      changePassword: jest.fn(),
      registerLoginFailure: jest.fn().mockResolvedValue({}),
      registerLoginSuccess: jest.fn().mockResolvedValue('session-1'),
    };
    jwtService = {
      signAsync: jest.fn().mockResolvedValue('access-token'),
    };
    configService = {
      get: jest.fn().mockReturnValue('bootstrap-secret'),
    };

    service = new AuthService(
      usersService as unknown as UsersService,
      jwtService as unknown as JwtService,
      configService as unknown as ConfigService,
    );
  });

  it('login berhasil mengembalikan token dan user tanpa password', async () => {
    const now = new Date('2026-07-01T00:00:00.000Z');
    const hashedPassword = await bcrypt.hash('password123', 10);
    usersService.findByEmail.mockResolvedValue({
      id: 'user-1',
      name: 'Owner',
      email: 'owner@mail.com',
      password: hashedPassword,
      role: Role.OWNER,
      schoolId: null,
      createdAt: now,
      updatedAt: now,
      failedLoginAttempts: 0,
      lockedUntil: null,
    });

    const result = await service.login({
      email: 'owner@mail.com',
      password: 'password123',
    });

    expect(jwtService.signAsync).toHaveBeenCalledWith({
      sub: 'user-1',
      email: 'owner@mail.com',
      role: Role.OWNER,
      schoolId: null,
      sessionId: 'session-1',
    });
    expect(result).toEqual({
      accessToken: 'access-token',
      user: {
        id: 'user-1',
        name: 'Owner',
        email: 'owner@mail.com',
        role: Role.OWNER,
        schoolId: null,
        createdAt: now,
        updatedAt: now,
      },
    });
    expect(result.user).not.toHaveProperty('password');
  });

  it('menolak login jika email tidak ditemukan', async () => {
    usersService.findByEmail.mockResolvedValue(null);

    await expect(
      service.login({
        email: 'missing@mail.com',
        password: 'password123',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('menolak login jika password salah', async () => {
    usersService.findByEmail.mockResolvedValue({
      id: 'user-1',
      email: 'owner@mail.com',
      password: await bcrypt.hash('password-benar', 10),
      role: Role.OWNER,
      schoolId: null,
      failedLoginAttempts: 0,
      lockedUntil: null,
    });

    await expect(
      service.login({
        email: 'owner@mail.com',
        password: 'password-salah',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(usersService.registerLoginFailure).toHaveBeenCalled();
  });

  it('bootstrapOwner meneruskan request jika secret valid', () => {
    usersService.createBootstrapOwner.mockReturnValue({ id: 'owner-1' });

    expect(
      service.bootstrapOwner(
        {
          name: 'Owner',
          email: 'owner@mail.com',
          password: 'password123',
        },
        'bootstrap-secret',
      ),
    ).toEqual({ id: 'owner-1' });
  });

  it('bootstrapOwner menolak secret yang salah', () => {
    expect(() =>
      service.bootstrapOwner(
        {
          name: 'Owner',
          email: 'owner@mail.com',
          password: 'password123',
        },
        'secret-salah',
      ),
    ).toThrow(ForbiddenException);
  });

  it('changePassword meneruskan request ke UsersService', () => {
    usersService.changePassword.mockReturnValue({
      message: 'Password berhasil diubah',
    });

    expect(
      service.changePassword('user-1', {
        oldPassword: 'passwordLama123',
        newPassword: 'passwordBaru123',
      }),
    ).toEqual({ message: 'Password berhasil diubah' });
    expect(usersService.changePassword).toHaveBeenCalledWith('user-1', {
      oldPassword: 'passwordLama123',
      newPassword: 'passwordBaru123',
    });
  });
});
