import { ForbiddenException } from '@nestjs/common';
import { SchoolLevel as PrismaSchoolLevel } from '.prisma/client';
import { EmployeeType, Role, Status } from '../common/enums/role.enum';
import { AuthUser } from '../common/types/auth-user.type';
import { PrismaService } from '../prisma/prisma.service';
import { DashboardService } from './dashboard.service';

type CountMock = jest.Mock<Promise<number>, [unknown?]>;

type MockPrisma = {
  school: {
    count: CountMock;
    groupBy: jest.Mock;
  };
  student: {
    count: CountMock;
    groupBy: jest.Mock;
  };
  employee: {
    count: CountMock;
    groupBy: jest.Mock;
  };
  schoolAsset: {
    count: CountMock;
  };
  facility: {
    count: CountMock;
  };
  finance: {
    count: CountMock;
  };
  document: {
    count: CountMock;
  };
};

describe('DashboardService', () => {
  let service: DashboardService;
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
    prisma = {
      school: {
        count: jest.fn<Promise<number>, [unknown?]>().mockResolvedValue(1),
        groupBy: jest.fn().mockResolvedValue([
          { level: PrismaSchoolLevel.tk_kb, _count: { _all: 1 } },
          { level: PrismaSchoolLevel.sd, _count: { _all: 2 } },
          { level: PrismaSchoolLevel.sma_smk, _count: { _all: 3 } },
        ]),
      },
      student: {
        count: jest.fn<Promise<number>, [unknown?]>().mockResolvedValue(10),
        groupBy: jest
          .fn()
          .mockResolvedValue([{ schoolId: 'school-1', _count: { _all: 10 } }]),
      },
      employee: {
        count: jest.fn<Promise<number>, [unknown?]>().mockResolvedValue(5),
        groupBy: jest
          .fn()
          .mockResolvedValue([{ schoolId: 'school-1', _count: { _all: 5 } }]),
      },
      schoolAsset: {
        count: jest.fn<Promise<number>, [unknown?]>().mockResolvedValue(4),
      },
      facility: {
        count: jest.fn<Promise<number>, [unknown?]>().mockResolvedValue(8),
      },
      finance: {
        count: jest.fn<Promise<number>, [unknown?]>().mockResolvedValue(7),
      },
      document: {
        count: jest.fn<Promise<number>, [unknown?]>().mockResolvedValue(6),
      },
    };

    service = new DashboardService(prisma as unknown as PrismaService);
  });

  it('mengembalikan summary owner tanpa scope schoolId', async () => {
    const result = await service.getSummary(owner);

    expect(prisma.school.count).toHaveBeenCalledWith({
      where: { archivedAt: null },
    });
    expect(result.totals).toMatchObject({
      schools: 1,
      students: 10,
      employees: 5,
      teachers: 5,
      staff: 5,
      assets: 4,
      facilities: 8,
      finances: 7,
      documents: 6,
    });
    expect(result.schoolsByLevel).toEqual({
      tkKb: 1,
      sd: 2,
      smp: 0,
      smaSmk: 3,
    });
  });

  it('mengembalikan summary role school dengan scope schoolId token', async () => {
    await service.getSummary(schoolUser);

    expect(prisma.student.count).toHaveBeenCalledWith({
      where: { schoolId: 'school-token' },
    });
    expect(prisma.employee.count).toHaveBeenCalledWith({
      where: { schoolId: 'school-token', type: EmployeeType.GURU },
    });
    expect(prisma.employee.count).toHaveBeenCalledWith({
      where: { schoolId: 'school-token', status: Status.TETAP },
    });
  });

  it('menolak summary school jika user belum punya schoolId', async () => {
    await expect(
      service.getSummary({
        sub: 'school-user-1',
        email: 'school@mail.com',
        role: Role.SCHOOL,
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
