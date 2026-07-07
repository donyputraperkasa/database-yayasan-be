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
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';
import type { File as MulterFile } from 'multer';
import { Roles } from '../common/decorators/roles.decorator';
import { EmployeeType, Role } from '../common/enums/role.enum';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { AuthUser } from '../common/types/auth-user.type';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import {
  employeeDecreeApiBody,
  employeeDecreeFileFilter,
  employeeDecreeStorage,
  maxEmployeeDecreeSize,
} from './employee-decree-upload.config';
import {
  employeePhotoApiBody,
  employeePhotoFileFilter,
  employeePhotoStorage,
  maxEmployeePhotoSize,
} from './employee-photo-upload.config';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { EmployeesService } from './employees.service';

type RequestWithUser = Request & {
  user: AuthUser;
};

type UploadedEmployeePhoto = Pick<MulterFile, 'filename'>;

@ApiTags('Employees')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('employees')
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Roles(Role.OWNER, Role.SCHOOL)
  @Post()
  create(@Body() dto: CreateEmployeeDto, @Req() request: RequestWithUser) {
    return this.employeesService.create(dto, request.user);
  }

  @Roles(Role.OWNER, Role.SCHOOL)
  @ApiConsumes('multipart/form-data')
  @ApiBody(employeePhotoApiBody)
  @UseInterceptors(
    FileInterceptor('file', {
      fileFilter: employeePhotoFileFilter,
      limits: { fileSize: maxEmployeePhotoSize },
      storage: employeePhotoStorage,
    }),
  )
  @Post(':id/photo')
  uploadPhoto(
    @Param('id') id: string,
    @UploadedFile() file: UploadedEmployeePhoto,
    @Req() request: RequestWithUser,
  ) {
    if (!file) {
      throw new BadRequestException('Foto wajib diupload');
    }

    const photoUrl = `/uploads/employees/${file.filename}`;

    return this.employeesService.uploadPhoto(id, photoUrl, request.user);
  }

  @Roles(Role.OWNER, Role.SCHOOL)
  @ApiConsumes('multipart/form-data')
  @ApiBody(employeeDecreeApiBody)
  @UseInterceptors(
    FileInterceptor('file', {
      fileFilter: employeeDecreeFileFilter,
      limits: { fileSize: maxEmployeeDecreeSize },
      storage: employeeDecreeStorage,
    }),
  )
  @Post(':id/decree')
  uploadDecree(
    @Param('id') id: string,
    @UploadedFile() file: UploadedEmployeePhoto,
    @Req() request: RequestWithUser,
  ) {
    if (!file) {
      throw new BadRequestException('Scan SK wajib diupload');
    }

    const decreeUrl = `/uploads/employees/decrees/${file.filename}`;

    return this.employeesService.uploadDecree(id, decreeUrl, request.user);
  }

  @Roles(Role.OWNER, Role.OFFICE, Role.SCHOOL)
  @ApiQuery({ name: 'schoolId', required: false })
  @ApiQuery({ name: 'type', required: false, enum: EmployeeType })
  @Get()
  findAll(
    @Req() request: RequestWithUser,
    @Query('schoolId') schoolId?: string,
    @Query('type') type?: EmployeeType,
  ) {
    return this.employeesService.findAll(request.user, schoolId, type);
  }

  @Roles(Role.OWNER, Role.OFFICE, Role.SCHOOL)
  @Get(':id')
  findById(@Param('id') id: string, @Req() request: RequestWithUser) {
    return this.employeesService.findById(id, request.user);
  }

  @Roles(Role.OWNER, Role.SCHOOL)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateEmployeeDto,
    @Req() request: RequestWithUser,
  ) {
    return this.employeesService.update(id, dto, request.user);
  }

  @Roles(Role.OWNER, Role.SCHOOL)
  @Delete(':id')
  remove(@Param('id') id: string, @Req() request: RequestWithUser) {
    return this.employeesService.remove(id, request.user);
  }
}
