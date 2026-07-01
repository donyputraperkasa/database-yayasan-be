import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Gender, Role } from '../common/enums/role.enum';
import { AuthUser } from '../common/types/auth-user.type';
import { PrismaService } from '../prisma/prisma.service';
import { StudentsService } from './students.service';

type MockPrisma = {
  school: {
    findUnique: jest.Mock;
  };
  student: {
    create: jest.Mock;
    findMany: jest.Mock;
    findUnique: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };
};

type StudentWritePayload = {
  data: Record<string, unknown>;
};

describe('StudentsService', () => {
  let service: StudentsService;
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
        findUnique: jest.fn().mockResolvedValue({ id: 'school-1' }),
      },
      student: {
        create: jest.fn(({ data }) =>
          Promise.resolve({ id: 'student-1', ...data }),
        ),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    service = new StudentsService(prisma as unknown as PrismaService);
  });

  it('owner wajib mengirim schoolId saat membuat siswa', async () => {
    await expect(
      service.create(
        {
          name: 'Siswa Test',
        },
        owner,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('role school membuat siswa memakai schoolId dari token', async () => {
    prisma.school.findUnique.mockResolvedValue({ id: 'school-token' });

    await service.create(
      {
        schoolId: 'school-body',
        name: 'Siswa Test',
        gender: Gender.FEMALE,
      },
      schoolUser,
    );

    expect(prisma.school.findUnique).toHaveBeenCalledWith({
      where: { id: 'school-token' },
      select: { id: true },
    });
    expect(getLastStudentCreateData()).toMatchObject({
      schoolId: 'school-token',
      name: 'Siswa Test',
    });
  });

  it('findAll role school otomatis memakai schoolId dari token', async () => {
    prisma.student.findMany.mockResolvedValue([]);

    await service.findAll(schoolUser, 'school-body', '6A');

    expect(prisma.student.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          schoolId: 'school-token',
          className: '6A',
        },
      }),
    );
  });

  it('menolak akses siswa sekolah lain', async () => {
    prisma.student.findUnique.mockResolvedValue({
      id: 'student-1',
      schoolId: 'school-other',
    });

    await expect(
      service.findById('student-1', schoolUser),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('update menolak jika siswa tidak ditemukan', async () => {
    prisma.student.findUnique.mockResolvedValue(null);

    await expect(
      service.update('student-1', { name: 'Nama Baru' }, owner),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  function getLastStudentCreateData() {
    const calls = prisma.student.create.mock.calls as Array<
      [StudentWritePayload]
    >;
    const lastCall = calls.at(-1);

    if (!lastCall) {
      throw new Error('student.create belum dipanggil');
    }

    return lastCall[0].data;
  }
});
