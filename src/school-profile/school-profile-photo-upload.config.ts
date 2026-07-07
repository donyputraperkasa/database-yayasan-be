import { BadRequestException } from '@nestjs/common';
import type { ApiBodyOptions } from '@nestjs/swagger';
import { existsSync, mkdirSync } from 'fs';
import { diskStorage } from 'multer';
import type { StorageEngine } from 'multer';
import { extname, join } from 'path';

type UploadedPhotoCandidate = {
  mimetype: string;
};

export const schoolProfilePhotoPath = join(
  process.cwd(),
  'uploads',
  'school-profiles',
);
export const maxSchoolProfilePhotoSizeMb = 2;
export const maxSchoolProfilePhotoSize =
  maxSchoolProfilePhotoSizeMb * 1024 * 1024;

export const schoolProfilePhotoApiBody: ApiBodyOptions = {
  schema: {
    type: 'object',
    required: ['file'],
    properties: {
      file: {
        type: 'string',
        format: 'binary',
        description: `Foto atau logo JPG, PNG, atau WEBP maksimal ${maxSchoolProfilePhotoSizeMb} MB`,
      },
    },
  },
};

export const schoolProfilePhotoStorage: StorageEngine = diskStorage({
  destination: (_request, _file, callback) => {
    if (!existsSync(schoolProfilePhotoPath)) {
      mkdirSync(schoolProfilePhotoPath, { recursive: true });
    }

    callback(null, schoolProfilePhotoPath);
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

export function schoolProfilePhotoFileFilter(
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
