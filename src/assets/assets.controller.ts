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
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ApiBody, ApiConsumes } from '@nestjs/swagger';
import { Request } from 'express';
import type { File as MulterFile } from 'multer';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { AuthUser } from '../common/types/auth-user.type';
import {
  assetPhotoApiBody,
  assetPhotoFileFilter,
  assetPhotoStorage,
  maxAssetPhotoSize,
} from './asset-photo-upload.config';
import { AssetsService } from './assets.service';
import { CreateAssetDto } from './dto/create-asset.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';

type RequestWithUser = Request & {
  user: AuthUser;
};

type UploadedAssetPhoto = Pick<MulterFile, 'filename'>;

@ApiTags('Assets')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('assets')
export class AssetsController {
  constructor(private readonly assetsService: AssetsService) {}

  @Roles(Role.OWNER, Role.SCHOOL)
  @Post()
  create(@Body() dto: CreateAssetDto, @Req() request: RequestWithUser) {
    return this.assetsService.create(dto, request.user);
  }

  @Roles(Role.OWNER, Role.SCHOOL)
  @ApiConsumes('multipart/form-data')
  @ApiBody(assetPhotoApiBody)
  @UseInterceptors(
    FileInterceptor('file', {
      fileFilter: assetPhotoFileFilter,
      limits: { fileSize: maxAssetPhotoSize },
      storage: assetPhotoStorage,
    }),
  )
  @Post(':id/photo')
  uploadPhoto(
    @Param('id') id: string,
    @UploadedFile() file: UploadedAssetPhoto,
    @Req() request: RequestWithUser,
  ) {
    if (!file) {
      throw new BadRequestException('Foto wajib diupload');
    }

    const photoUrl = `/uploads/assets/${file.filename}`;

    return this.assetsService.uploadPhoto(id, photoUrl, request.user);
  }

  @Roles(Role.OWNER, Role.OFFICE, Role.SCHOOL)
  @ApiQuery({ name: 'schoolId', required: false })
  @Get()
  findAll(
    @Req() request: RequestWithUser,
    @Query('schoolId') schoolId?: string,
  ) {
    return this.assetsService.findAll(request.user, schoolId);
  }

  @Roles(Role.OWNER, Role.OFFICE, Role.SCHOOL)
  @Get(':id')
  findById(@Param('id') id: string, @Req() request: RequestWithUser) {
    return this.assetsService.findById(id, request.user);
  }

  @Roles(Role.OWNER, Role.SCHOOL)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateAssetDto,
    @Req() request: RequestWithUser,
  ) {
    return this.assetsService.update(id, dto, request.user);
  }

  @Roles(Role.OWNER, Role.SCHOOL)
  @Delete(':id')
  remove(@Param('id') id: string, @Req() request: RequestWithUser) {
    return this.assetsService.remove(id, request.user);
  }
}
