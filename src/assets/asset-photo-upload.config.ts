import { BadRequestException } from '@nestjs/common';
import type { ApiBodyOptions } from '@nestjs/swagger';
import { existsSync, mkdirSync } from 'fs';
import { diskStorage } from 'multer';
import type { StorageEngine } from 'multer';
import { extname, join } from 'path';

type UploadedPhotoCandidate = {
  mimetype: string;
  originalname: string;
};

export const assetPhotoPath = join(process.cwd(), 'uploads', 'assets');
export const maxAssetPhotoSizeMb = 2;
export const maxAssetPhotoSize = maxAssetPhotoSizeMb * 1024 * 1024;

export const assetPhotoApiBody: ApiBodyOptions = {
  schema: {
    type: 'object',
    required: ['file'],
    properties: {
      file: {
        type: 'string',
        format: 'binary',
        description: `Foto JPG, PNG, atau WEBP maksimal ${maxAssetPhotoSizeMb} MB`,
      },
    },
  },
};

export const assetPhotoStorage: StorageEngine = diskStorage({
  destination: (_request, _file, callback) => {
    if (!existsSync(assetPhotoPath)) {
      mkdirSync(assetPhotoPath, { recursive: true });
    }

    callback(null, assetPhotoPath);
  },
  filename: (_request, file: UploadedPhotoCandidate, callback) => {
    const extension = extname(file.originalname).toLowerCase();
    const safeName = file.originalname
      .replace(extname(file.originalname), '')
      .replace(/[^a-zA-Z0-9-_]/g, '-')
      .toLowerCase();

    callback(null, `${Date.now()}-${safeName}${extension}`);
  },
});

export function assetPhotoFileFilter(
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
