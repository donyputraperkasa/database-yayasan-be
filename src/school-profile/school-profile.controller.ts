import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import type { File as MulterFile } from 'multer';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { AuthUser } from '../common/types/auth-user.type';
import { UpdateSchoolProfileDto } from './dto/update-school-profile.dto';
import {
  maxSchoolProfilePhotoSize,
  schoolProfilePhotoApiBody,
  schoolProfilePhotoFileFilter,
  schoolProfilePhotoStorage,
} from './school-profile-photo-upload.config';
import { SchoolProfileService } from './school-profile.service';

type RequestWithUser = Request & {
  user: AuthUser;
};

type UploadedSchoolProfilePhoto = Pick<MulterFile, 'filename'>;

@ApiTags('School Profile')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('school-profile')
export class SchoolProfileController {
  constructor(private readonly schoolProfileService: SchoolProfileService) {}

  @Roles(Role.OWNER, Role.OFFICE, Role.SCHOOL)
  @Get(':schoolId')
  findBySchoolId(
    @Param('schoolId') schoolId: string,
    @Req() request: RequestWithUser,
  ) {
    return this.schoolProfileService.findBySchoolId(schoolId, request.user);
  }

  @Roles(Role.OWNER, Role.SCHOOL)
  @Patch(':schoolId')
  upsertBySchoolId(
    @Param('schoolId') schoolId: string,
    @Body() dto: UpdateSchoolProfileDto,
    @Req() request: RequestWithUser,
  ) {
    return this.schoolProfileService.upsertBySchoolId(
      schoolId,
      dto,
      request.user,
    );
  }

  @Roles(Role.OWNER, Role.SCHOOL)
  @ApiConsumes('multipart/form-data')
  @ApiBody(schoolProfilePhotoApiBody)
  @UseInterceptors(
    FileInterceptor('file', {
      fileFilter: schoolProfilePhotoFileFilter,
      limits: { fileSize: maxSchoolProfilePhotoSize },
      storage: schoolProfilePhotoStorage,
    }),
  )
  @Post(':schoolId/photo')
  uploadPhoto(
    @Param('schoolId') schoolId: string,
    @UploadedFile() file: UploadedSchoolProfilePhoto,
    @Req() request: RequestWithUser,
  ) {
    const photoUrl = `/uploads/school-profiles/${file.filename}`;

    return this.schoolProfileService.uploadPhoto(
      schoolId,
      photoUrl,
      request.user,
    );
  }
}
