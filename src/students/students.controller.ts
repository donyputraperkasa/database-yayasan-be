import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { AuthUser } from '../common/types/auth-user.type';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { StudentsService } from './students.service';

type RequestWithUser = Request & {
  user: AuthUser;
};

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
