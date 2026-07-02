import { BadRequestException } from '@nestjs/common';
import type { ApiBodyOptions } from '@nestjs/swagger';
import { existsSync, mkdirSync } from 'fs';
import { diskStorage } from 'multer';
import type { StorageEngine } from 'multer';
import { extname, join } from 'path';

type UploadedPhotoCandidate = {
  mimetype: string;
};

export const studentPhotoPath = join(process.cwd(), 'uploads', 'students');
export const maxStudentPhotoSizeMb = 2;
export const maxStudentPhotoSize = maxStudentPhotoSizeMb * 1024 * 1024;

export const studentPhotoApiBody: ApiBodyOptions = {
  schema: {
    type: 'object',
    required: ['file'],
    properties: {
      file: {
        type: 'string',
        format: 'binary',
        description: `Foto JPG, PNG, atau WEBP maksimal ${maxStudentPhotoSizeMb} MB`,
      },
    },
  },
};

export const studentPhotoStorage: StorageEngine = diskStorage({
  destination: (_request, _file, callback) => {
    // Folder dibuat otomatis agar upload tetap jalan di server baru.
    if (!existsSync(studentPhotoPath)) {
      mkdirSync(studentPhotoPath, { recursive: true });
    }

    callback(null, studentPhotoPath);
  },
  filename: (_request, file, callback) => {
    // Nama file dibuat aman untuk URL dan diberi timestamp agar tidak tabrakan.
    const extension = extname(file.originalname).toLowerCase();
    const safeName = file.originalname
      .replace(extname(file.originalname), '')
      .replace(/[^a-zA-Z0-9-_]/g, '-')
      .toLowerCase();

    callback(null, `${Date.now()}-${safeName}${extension}`);
  },
});

export function studentPhotoFileFilter(
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
