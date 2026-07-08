import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { FinanceType, Role } from '../common/enums/role.enum';
import { AuthUser } from '../common/types/auth-user.type';
import { PrismaService } from '../prisma/prisma.service';
import { FinancesService } from './finances.service';

type MockPrisma = {
  school: {
    findUnique: jest.Mock;
  };
  finance: {
    create: jest.Mock;
    findMany: jest.Mock;
    findUnique: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };
};

type FinanceWritePayload = {
  data: Record<string, unknown>;
};

describe('FinancesService', () => {
  let service: FinancesService;
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
    schoolId: 'school-token',
  };

  beforeEach(() => {
    prisma = {
      school: {
        findUnique: jest.fn().mockResolvedValue({ id: 'school-1' }),
      },
      finance: {
        create: jest.fn(({ data }) =>
          Promise.resolve({ id: 'finance-1', ...data }),
        ),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };
    auditLogsService = {
      create: jest.fn().mockResolvedValue(undefined),
    };

    service = new FinancesService(
      auditLogsService as AuditLogsService,
      prisma as unknown as PrismaService,
    );
  });

  it('owner wajib mengirim schoolId saat membuat data finance', async () => {
    await expect(
      service.create(
        {
          type: FinanceType.SPP,
          amount: 250000,
        },
        owner,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('create mengubah date string menjadi Date dan mendukung lain_lain', async () => {
    await service.create(
      {
        schoolId: 'school-1',
        type: FinanceType.LAIN_LAIN,
        amount: 500000,
        date: '2026-07-01',
        note: 'Dana kegiatan sekolah',
      },
      owner,
    );

    expect(getLastFinanceCreateData()).toMatchObject({
      schoolId: 'school-1',
      type: FinanceType.LAIN_LAIN,
      amount: 500000,
      date: new Date('2026-07-01'),
      note: 'Dana kegiatan sekolah',
    });
  });

  it('findAll role school otomatis memakai schoolId dari token', async () => {
    prisma.finance.findMany.mockResolvedValue([]);

    await service.findAll(schoolUser, 'school-body', FinanceType.SPP, '6A');

    expect(prisma.finance.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          schoolId: 'school-token',
          type: FinanceType.SPP,
          className: '6A',
        },
      }),
    );
  });

  it('menolak akses finance sekolah lain', async () => {
    prisma.finance.findUnique.mockResolvedValue({
      id: 'finance-1',
      schoolId: 'school-other',
    });

    await expect(
      service.findById('finance-1', schoolUser),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('remove menolak jika data finance tidak ditemukan', async () => {
    prisma.finance.findUnique.mockResolvedValue(null);

    await expect(service.remove('finance-1', owner)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  function getLastFinanceCreateData() {
    const calls = prisma.finance.create.mock.calls as Array<
      [FinanceWritePayload]
    >;
    const lastCall = calls.at(-1);

    if (!lastCall) {
      throw new Error('finance.create belum dipanggil');
    }

    return lastCall[0].data;
  }
});
