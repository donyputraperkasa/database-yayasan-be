import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { Role } from '../common/enums/role.enum';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from './users.service';

type MockPrisma = {
  school: {
    findUnique: jest.Mock;
  };
  user: {
    count: jest.Mock;
    findUnique: jest.Mock;
    create: jest.Mock;
    findMany: jest.Mock;
    update: jest.Mock;
  };
};

type UserUpdatePayload = {
  where: { id: string };
  data: {
    password: string;
  };
};

describe('UsersService', () => {
  let service: UsersService;
  let prisma: MockPrisma;
  let auditLogsService: Pick<AuditLogsService, 'create'>;

  beforeEach(() => {
    prisma = {
      school: {
        findUnique: jest.fn(),
      },
      user: {
        count: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },
    };
    auditLogsService = {
      create: jest.fn().mockResolvedValue(undefined),
    };

    service = new UsersService(
      auditLogsService as AuditLogsService,
      prisma as unknown as PrismaService,
    );
  });

  it('menolak role school jika schoolId kosong', async () => {
    await expect(
      service.create({
        name: 'Admin Sekolah',
        email: 'school@mail.com',
        password: 'password123',
        role: Role.SCHOOL,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('menolak role office jika membawa schoolId', async () => {
    await expect(
      service.create({
        name: 'Admin Office',
        email: 'office@mail.com',
        password: 'password123',
        role: Role.OFFICE,
        schoolId: 'school-1',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('menolak create user school jika sekolah tidak ditemukan', async () => {
    prisma.school.findUnique.mockResolvedValue(null);

    await expect(
      service.create({
        name: 'Admin Sekolah',
        email: 'school@mail.com',
        password: 'password123',
        role: Role.SCHOOL,
        schoolId: 'school-1',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('create user mengembalikan data tanpa password', async () => {
    const now = new Date('2026-07-01T00:00:00.000Z');
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue({
      id: 'user-1',
      name: 'Owner',
      email: 'owner@mail.com',
      password: 'hashed-password',
      role: Role.OWNER,
      schoolId: null,
      createdAt: now,
      updatedAt: now,
    });

    const result = await service.create({
      name: 'Owner',
      email: 'owner@mail.com',
      password: 'password123',
      role: Role.OWNER,
    });

    expect(result).toEqual({
      id: 'user-1',
      name: 'Owner',
      email: 'owner@mail.com',
      role: Role.OWNER,
      schoolId: null,
      createdAt: now,
      updatedAt: now,
    });
    expect(result).not.toHaveProperty('password');
  });

  it('bootstrap owner hanya boleh berjalan saat belum ada user', async () => {
    prisma.user.count.mockResolvedValue(1);

    await expect(
      service.createBootstrapOwner({
        name: 'Owner',
        email: 'owner@mail.com',
        password: 'password123',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('changePassword menolak jika password lama salah', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      password: await bcrypt.hash('passwordBenar123', 10),
    });

    await expect(
      service.changePassword('user-1', {
        oldPassword: 'passwordSalah123',
        newPassword: 'passwordBaru123',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('changePassword mengubah password jika password lama benar', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      password: await bcrypt.hash('passwordLama123', 10),
    });
    prisma.user.update.mockResolvedValue({ id: 'user-1' });

    await expect(
      service.changePassword('user-1', {
        oldPassword: 'passwordLama123',
        newPassword: 'passwordBaru123',
      }),
    ).resolves.toEqual({
      message: 'Password berhasil diubah',
    });

    const payload = getLastUserUpdatePayload();
    expect(payload.where).toEqual({ id: 'user-1' });
    expect(typeof payload.data.password).toBe('string');
  });

  it('resetPassword owner mengubah password user target', async () => {
    const now = new Date('2026-07-01T00:00:00.000Z');
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      name: 'Admin Sekolah',
      email: 'school@mail.com',
      role: Role.SCHOOL,
      schoolId: 'school-1',
      createdAt: now,
      updatedAt: now,
    });
    prisma.user.update.mockResolvedValue({ id: 'user-1' });

    await expect(
      service.resetPassword('user-1', {
        newPassword: 'passwordBaru123',
      }),
    ).resolves.toEqual({
      message: 'Password berhasil direset',
    });

    const payload = getLastUserUpdatePayload();
    expect(payload.where).toEqual({ id: 'user-1' });
    expect(typeof payload.data.password).toBe('string');
  });

  function getLastUserUpdatePayload() {
    const calls = prisma.user.update.mock.calls as Array<[UserUpdatePayload]>;
    const lastCall = calls.at(-1);

    if (!lastCall) {
      throw new Error('user.update belum dipanggil');
    }

    return lastCall[0];
  }
});
