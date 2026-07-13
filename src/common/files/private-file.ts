import { NotFoundException } from '@nestjs/common';
import type { Response } from 'express';
import { existsSync } from 'fs';
import { resolve, sep } from 'path';

export function sendPrivateUpload(
  response: Response,
  fileUrl: string | null | undefined,
  folder: string,
  downloadName: string,
) {
  if (!fileUrl) throw new NotFoundException('File tidak ditemukan');

  const folderPath = resolve(process.cwd(), 'uploads', folder);
  const filePath = resolve(process.cwd(), fileUrl.replace(/^\/+/, ''));

  if (!filePath.startsWith(`${folderPath}${sep}`) || !existsSync(filePath)) {
    throw new NotFoundException('File tidak ditemukan');
  }

  const safeName = downloadName.replace(/[^a-zA-Z0-9._-]/g, '-');
  response.setHeader('Cache-Control', 'private, no-store');
  response.setHeader('Content-Disposition', `inline; filename="${safeName}"`);
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.sendFile(filePath);
}
