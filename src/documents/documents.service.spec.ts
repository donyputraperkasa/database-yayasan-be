import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '../common/enums/role.enum';
import { AuthUser } from '../common/types/auth-user.type';
import { PrismaService } from '../prisma/prisma.service';
import { DocumentsService } from './documents.service';

type MockPrisma = {
  school: {
    findUnique: jest.Mock;
  };
  document: {
    create: jest.Mock;
    findMany: jest.Mock;
    findUnique: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };
};

describe('DocumentsService', () => {
  let service: DocumentsService;
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
      document: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    service = new DocumentsService(prisma as unknown as PrismaService);
  });

  it('owner wajib mengirim schoolId saat upload dokumen', async () => {
    await expect(
      service.upload(
        {
          name: 'Akta Sekolah',
        },
        '/uploads/documents/akta.pdf',
        owner,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('upload role school memakai schoolId dari token', async () => {
    prisma.school.findUnique
      .mockResolvedValueOnce({ id: 'school-token' })
      .mockResolvedValueOnce({ canEdit: true });
    prisma.document.create.mockResolvedValue({ id: 'document-1' });

    await service.upload(
      {
        schoolId: 'school-body',
        name: 'Akta Sekolah',
      },
      '/uploads/documents/akta.pdf',
      schoolUser,
    );

    expect(prisma.document.create).toHaveBeenCalledWith({
      data: {
        schoolId: 'school-token',
        name: 'Akta Sekolah',
        fileUrl: '/uploads/documents/akta.pdf',
      },
      include: {
        school: true,
      },
    });
  });

  it('findAll role school otomatis memakai schoolId dari token', async () => {
    prisma.document.findMany.mockResolvedValue([]);

    await service.findAll(schoolUser, 'school-body');

    expect(prisma.document.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          schoolId: 'school-token',
        },
      }),
    );
  });

  it('menolak akses dokumen sekolah lain', async () => {
    prisma.document.findUnique.mockResolvedValue({
      id: 'document-1',
      schoolId: 'school-other',
    });

    await expect(
      service.findById('document-1', schoolUser),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('update menolak jika dokumen tidak ditemukan', async () => {
    prisma.document.findUnique.mockResolvedValue(null);

    await expect(
      service.update('document-1', { name: 'Nama Baru' }, owner),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
