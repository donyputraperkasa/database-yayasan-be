import { BadRequestException } from '@nestjs/common';
import type { ApiBodyOptions } from '@nestjs/swagger';
import { existsSync, mkdirSync } from 'fs';
import { diskStorage } from 'multer';
import type { StorageEngine } from 'multer';
import { extname, join } from 'path';

type UploadedDecreeCandidate = {
  mimetype: string;
};

export const employeeDecreePath = join(
  process.cwd(),
  'uploads',
  'employees',
  'decrees',
);
export const maxEmployeeDecreeSizeMb = 2;
export const maxEmployeeDecreeSize = maxEmployeeDecreeSizeMb * 1024 * 1024;

export const employeeDecreeApiBody: ApiBodyOptions = {
  schema: {
    type: 'object',
    required: ['file'],
    properties: {
      file: {
        type: 'string',
        format: 'binary',
        description: `Scan SK JPG, PNG, atau WEBP maksimal ${maxEmployeeDecreeSizeMb} MB`,
      },
    },
  },
};

export const employeeDecreeStorage: StorageEngine = diskStorage({
  destination: (_request, _file, callback) => {
    if (!existsSync(employeeDecreePath)) {
      mkdirSync(employeeDecreePath, { recursive: true });
    }

    callback(null, employeeDecreePath);
  },
  filename: (_request, file, callback) => {
    const extension = extname(file.originalname).toLowerCase();
    const safeName = file.originalname
      .replace(extname(file.originalname), '')
      .replace(/[^a-zA-Z0-9-_]/g, '-')
      .toLowerCase();

    callback(null, `${Date.now()}-${safeName}${extension}`);
  },
});

export function employeeDecreeFileFilter(
  _request: unknown,
  file: UploadedDecreeCandidate,
  callback: (error: Error | null, acceptFile: boolean) => void,
) {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

  if (!allowedTypes.includes(file.mimetype)) {
    callback(
      new BadRequestException('Scan SK harus berupa JPG, PNG, atau WEBP'),
      false,
    );
    return;
  }

  callback(null, true);
}
