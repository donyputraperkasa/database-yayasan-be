import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { Role, SchoolLevel } from '../common/enums/role.enum';
import { AuthUser } from '../common/types/auth-user.type';
import { PrismaService } from '../prisma/prisma.service';
import { SchoolsService } from './schools.service';

type MockPrisma = {
  school: {
    create: jest.Mock;
    findMany: jest.Mock;
    findUnique: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };
};

describe('SchoolsService', () => {
  let service: SchoolsService;
  let prisma: MockPrisma;
  let auditLogsService: Pick<AuditLogsService, 'create'>;

  const owner: AuthUser = {
    sub: 'owner-1',
    email: 'owner@mail.com',
    role: Role.OWNER,
  };

  const schoolUser: AuthUser = {
    sub: 'school-user-1',
    email: 'school@mail.com',
    role: Role.SCHOOL,
    schoolId: 'school-1',
  };

  beforeEach(() => {
    prisma = {
      school: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };
    auditLogsService = {
      create: jest.fn().mockResolvedValue(undefined),
    };

    service = new SchoolsService(
      auditLogsService as AuditLogsService,
      prisma as unknown as PrismaService,
    );
  });

  it('membuat sekolah baru', async () => {
    prisma.school.create.mockResolvedValue({
      id: 'school-1',
      name: 'SMA Test',
    });

    await expect(
      service.create(
        {
          name: 'SMA Test',
          level: SchoolLevel.SMA_SMK,
        },
        owner,
      ),
    ).resolves.toEqual({ id: 'school-1', name: 'SMA Test' });
    expect(prisma.school.create).toHaveBeenCalledWith({
      data: {
        name: 'SMA Test',
        level: SchoolLevel.SMA_SMK,
      },
    });
  });

  it('owner melihat semua sekolah', async () => {
    prisma.school.findMany.mockResolvedValue([{ id: 'school-1' }]);

    await expect(service.findAll(owner)).resolves.toEqual([{ id: 'school-1' }]);
    expect(prisma.school.findMany).toHaveBeenCalledWith({
      include: { profile: true },
      orderBy: { createdAt: 'desc' },
    });
  });

  it('role school hanya melihat sekolah dari token', async () => {
    prisma.school.findMany.mockResolvedValue([{ id: 'school-1' }]);

    await service.findAll(schoolUser);

    expect(prisma.school.findMany).toHaveBeenCalledWith({
      where: { id: 'school-1' },
      include: { profile: true },
      orderBy: { createdAt: 'desc' },
    });
  });

  it('role school tidak boleh melihat sekolah lain', async () => {
    await expect(
      service.findById('school-2', schoolUser),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('update menolak jika sekolah tidak ditemukan', async () => {
    prisma.school.findUnique.mockResolvedValue(null);

    await expect(
      service.update('school-1', { name: 'Nama Baru' }, owner),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
