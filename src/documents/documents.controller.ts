import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';
import { existsSync, mkdirSync } from 'fs';
import { diskStorage } from 'multer';
import type { File as MulterFile, StorageEngine } from 'multer';
import { extname, join } from 'path';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { AuthUser } from '../common/types/auth-user.type';
import {
  CreateDocumentDto,
  UpdateDocumentDto,
} from './dto/create-document.dto';
import { DocumentsService } from './documents.service';

type RequestWithUser = Request & {
  user: AuthUser;
};

type UploadedDocument = Pick<MulterFile, 'filename'>;

const uploadPath = join(process.cwd(), 'uploads', 'documents');
const maxDocumentSizeMb = 10;
const maxDocumentSize = maxDocumentSizeMb * 1024 * 1024;

const storage: StorageEngine = diskStorage({
  destination: (_request, _file, callback) => {
    if (!existsSync(uploadPath)) {
      mkdirSync(uploadPath, { recursive: true });
    }

    callback(null, uploadPath);
  },
  filename: (_request, file, callback) => {
    const safeName = file.originalname
      .replace(extname(file.originalname), '')
      .replace(/[^a-zA-Z0-9-_]/g, '-')
      .toLowerCase();
    const uniqueName = `${Date.now()}-${safeName}${extname(file.originalname)}`;

    callback(null, uniqueName);
  },
});

@ApiTags('Documents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Roles(Role.OWNER, Role.SCHOOL)
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['name', 'file'],
      properties: {
        schoolId: {
          type: 'string',
          description: 'Wajib untuk owner. Role school memakai schoolId token.',
        },
        name: { type: 'string', example: 'Akta Pendirian Sekolah' },
        file: {
          type: 'string',
          format: 'binary',
          description: `Ukuran maksimal ${maxDocumentSizeMb} MB`,
        },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage,
      limits: { fileSize: maxDocumentSize },
    }),
  )
  @Post('upload')
  upload(
    @Body() dto: CreateDocumentDto,
    @UploadedFile() file: UploadedDocument,
    @Req() request: RequestWithUser,
  ) {
    if (!file) {
      throw new BadRequestException('File wajib diupload');
    }

    const fileUrl = `/uploads/documents/${file.filename}`;

    return this.documentsService.upload(dto, fileUrl, request.user);
  }

  @Roles(Role.OWNER, Role.OFFICE, Role.SCHOOL)
  @ApiQuery({ name: 'schoolId', required: false })
  @Get()
  findAll(
    @Req() request: RequestWithUser,
    @Query('schoolId') schoolId?: string,
  ) {
    return this.documentsService.findAll(request.user, schoolId);
  }

  @Roles(Role.OWNER, Role.OFFICE, Role.SCHOOL)
  @Get(':id')
  findById(@Param('id') id: string, @Req() request: RequestWithUser) {
    return this.documentsService.findById(id, request.user);
  }

  @Roles(Role.OWNER, Role.SCHOOL)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateDocumentDto,
    @Req() request: RequestWithUser,
  ) {
    return this.documentsService.update(id, dto, request.user);
  }

  @Roles(Role.OWNER, Role.SCHOOL)
  @Delete(':id')
  remove(@Param('id') id: string, @Req() request: RequestWithUser) {
    return this.documentsService.remove(id, request.user);
  }
}
