import { BadRequestException } from '@nestjs/common';
import type { ApiBodyOptions } from '@nestjs/swagger';
import { existsSync, mkdirSync } from 'fs';
import { diskStorage } from 'multer';
import type { StorageEngine } from 'multer';
import { extname, join } from 'path';

type UploadedPhotoCandidate = {
  mimetype: string;
};

export const employeePhotoPath = join(process.cwd(), 'uploads', 'employees');
export const maxEmployeePhotoSizeMb = 2;
export const maxEmployeePhotoSize = maxEmployeePhotoSizeMb * 1024 * 1024;

export const employeePhotoApiBody: ApiBodyOptions = {
  schema: {
    type: 'object',
    required: ['file'],
    properties: {
      file: {
        type: 'string',
        format: 'binary',
        description: `Foto JPG, PNG, atau WEBP maksimal ${maxEmployeePhotoSizeMb} MB`,
      },
    },
  },
};

export const employeePhotoStorage: StorageEngine = diskStorage({
  destination: (_request, _file, callback) => {
    // Folder dibuat otomatis agar upload foto pegawai siap di server baru.
    if (!existsSync(employeePhotoPath)) {
      mkdirSync(employeePhotoPath, { recursive: true });
    }

    callback(null, employeePhotoPath);
  },
  filename: (_request, file, callback) => {
    // Nama file dibuat aman untuk URL dan diberi timestamp agar unik.
    const extension = extname(file.originalname).toLowerCase();
    const safeName = file.originalname
      .replace(extname(file.originalname), '')
      .replace(/[^a-zA-Z0-9-_]/g, '-')
      .toLowerCase();

    callback(null, `${Date.now()}-${safeName}${extension}`);
  },
});

export function employeePhotoFileFilter(
  _request: unknown,
  file: UploadedPhotoCandidate,
  callback: (error: Error | null, acceptFile: boolean) => void,
) {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

  if (!allowedTypes.includes(file.mimetype)) {
    callback(
      new BadRequestException('Foto harus berupa JPG, PNG, atau WEBP'),
      false,
    );
    return;
  }

  callback(null, true);
}
