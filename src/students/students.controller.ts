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
import type { File as MulterFile } from 'multer';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { AuthUser } from '../common/types/auth-user.type';
import { CreateStudentDto } from './dto/create-student.dto';
import {
  maxStudentPhotoSize,
  studentPhotoApiBody,
  studentPhotoFileFilter,
  studentPhotoStorage,
} from './student-photo-upload.config';
import { UpdateStudentDto } from './dto/update-student.dto';
import { StudentsService } from './students.service';

type RequestWithUser = Request & {
  user: AuthUser;
};

type UploadedStudentPhoto = Pick<MulterFile, 'filename'>;

@ApiTags('Students')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Roles(Role.OWNER, Role.SCHOOL)
  @Post()
  create(@Body() dto: CreateStudentDto, @Req() request: RequestWithUser) {
    return this.studentsService.create(dto, request.user);
  }

  @Roles(Role.OWNER, Role.SCHOOL)
  @ApiConsumes('multipart/form-data')
  @ApiBody(studentPhotoApiBody)
  @UseInterceptors(
    FileInterceptor('file', {
      fileFilter: studentPhotoFileFilter,
      limits: { fileSize: maxStudentPhotoSize },
      storage: studentPhotoStorage,
    }),
  )
  @Post(':id/photo')
  uploadPhoto(
    @Param('id') id: string,
    @UploadedFile() file: UploadedStudentPhoto,
    @Req() request: RequestWithUser,
  ) {
    if (!file) {
      throw new BadRequestException('Foto wajib diupload');
    }

    const photoUrl = `/uploads/students/${file.filename}`;

    return this.studentsService.uploadPhoto(id, photoUrl, request.user);
  }

  @Roles(Role.OWNER, Role.OFFICE, Role.SCHOOL)
  @ApiQuery({ name: 'schoolId', required: false })
  @ApiQuery({ name: 'className', required: false })
  @Get()
  findAll(
    @Req() request: RequestWithUser,
    @Query('schoolId') schoolId?: string,
    @Query('className') className?: string,
  ) {
    return this.studentsService.findAll(request.user, schoolId, className);
  }

  @Roles(Role.OWNER, Role.OFFICE, Role.SCHOOL)
  @Get(':id')
  findById(@Param('id') id: string, @Req() request: RequestWithUser) {
    return this.studentsService.findById(id, request.user);
  }

  @Roles(Role.OWNER, Role.SCHOOL)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateStudentDto,
    @Req() request: RequestWithUser,
  ) {
    return this.studentsService.update(id, dto, request.user);
  }

  @Roles(Role.OWNER, Role.SCHOOL)
  @Delete(':id')
  remove(@Param('id') id: string, @Req() request: RequestWithUser) {
    return this.studentsService.remove(id, request.user);
  }
}
