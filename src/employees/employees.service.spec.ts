import { BadRequestException } from '@nestjs/common';
import { EmployeeType, Role } from '../common/enums/role.enum';
import { AuthUser } from '../common/types/auth-user.type';
import { PrismaService } from '../prisma/prisma.service';
import { EmployeesService } from './employees.service';

type MockPrisma = {
  school: {
    findUnique: jest.Mock;
  };
  employee: {
    create: jest.Mock;
    findUnique: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
    findMany: jest.Mock;
  };
};

type EmployeeWritePayload = {
  data: Record<string, unknown>;
};

describe('EmployeesService', () => {
  let service: EmployeesService;
  let prisma: MockPrisma;

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
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-07-01T00:00:00.000Z'));

    prisma = {
      school: {
        findUnique: jest.fn().mockResolvedValue({ id: 'school-1' }),
      },
      employee: {
        create: jest.fn(({ data }) =>
          Promise.resolve({ id: 'employee-1', ...data }),
        ),
        findUnique: jest.fn(),
        update: jest.fn(({ data }) =>
          Promise.resolve({ id: 'employee-1', ...data }),
        ),
        delete: jest.fn(),
        findMany: jest.fn(),
      },
    };

    service = new EmployeesService(prisma as unknown as PrismaService);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('menghitung masa kerja dan pensiun guru dari joinDate dan birthDate', async () => {
    await service.create(
      {
        schoolId: 'school-1',
        name: 'Bapak Yohanes',
        type: EmployeeType.GURU,
        birthDate: '1988-07-01',
        joinDate: '2020-07-01',
      },
      owner,
    );

    expect(getLastEmployeeCreateData()).toMatchObject({
      schoolId: 'school-1',
      workingPeriod: '6 years 0 months',
      retirementAge: 60,
      birthDate: new Date('1988-07-01'),
      joinDate: new Date('2020-07-01'),
      retirementDate: new Date('2048-07-01'),
    });
  });

  it('menghitung usia pensiun pegawai menjadi 56 tahun', async () => {
    await service.create(
      {
        schoolId: 'school-1',
        name: 'Ibu Maria',
        type: EmployeeType.PEGAWAI,
        birthDate: '1990-07-01',
        joinDate: '2021-01-01',
      },
      owner,
    );

    expect(getLastEmployeeCreateData()).toMatchObject({
      workingPeriod: '5 years 6 months',
      retirementAge: 56,
      retirementDate: new Date('2046-07-01'),
    });
  });

  it('role school memakai schoolId dari token, bukan dari body request', async () => {
    prisma.school.findUnique.mockResolvedValue({ id: 'school-token' });

    await service.create(
      {
        schoolId: 'school-body',
        name: 'Guru Sekolah',
        type: EmployeeType.GURU,
      },
      schoolUser,
    );

    expect(prisma.school.findUnique).toHaveBeenCalledWith({
      where: { id: 'school-token' },
      select: { id: true },
    });
    expect(getLastEmployeeCreateData()).toMatchObject({
      schoolId: 'school-token',
    });
  });

  it('menolak joinDate yang lebih besar dari tanggal hari ini', async () => {
    await expect(
      service.create(
        {
          schoolId: 'school-1',
          name: 'Guru Baru',
          type: EmployeeType.GURU,
          joinDate: '2027-01-01',
        },
        owner,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  function getLastEmployeeCreateData() {
    const calls = prisma.employee.create.mock.calls as Array<
      [EmployeeWritePayload]
    >;
    const lastCall = calls.at(-1);

    if (!lastCall) {
      throw new Error('employee.create belum dipanggil');
    }

    return lastCall[0].data;
  }
});
