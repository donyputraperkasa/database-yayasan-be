import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { AuthUser } from '../common/types/auth-user.type';
import { CreateSchoolDto } from './dto/create-school.dto';
import { UpdateSchoolEditAccessDto } from './dto/update-school-edit-access.dto';
import { UpdateSchoolDto } from './dto/update-school.dto';
import { SchoolsService } from './schools.service';

type RequestWithUser = Request & {
  user: AuthUser;
};

@ApiTags('Schools')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('schools')
export class SchoolsController {
  constructor(private readonly schoolsService: SchoolsService) {}

  @Roles(Role.OWNER)
  @Post()
  create(@Body() dto: CreateSchoolDto, @Req() request: RequestWithUser) {
    return this.schoolsService.create(dto, request.user);
  }

  @Roles(Role.OWNER, Role.OFFICE, Role.SCHOOL)
  @Get()
  findAll(@Req() request: RequestWithUser) {
    return this.schoolsService.findAll(request.user);
  }

  @Roles(Role.OWNER, Role.OFFICE, Role.SCHOOL)
  @Get(':id')
  findById(@Param('id') id: string, @Req() request: RequestWithUser) {
    return this.schoolsService.findById(id, request.user);
  }

  @Roles(Role.OWNER, Role.SCHOOL)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateSchoolDto,
    @Req() request: RequestWithUser,
  ) {
    return this.schoolsService.update(id, dto, request.user);
  }

  @Roles(Role.OWNER)
  @Patch(':id/edit-access')
  updateEditAccess(
    @Param('id') id: string,
    @Body() dto: UpdateSchoolEditAccessDto,
    @Req() request: RequestWithUser,
  ) {
    return this.schoolsService.updateEditAccess(id, dto.canEdit, request.user);
  }

  @Roles(Role.OWNER)
  @Delete(':id')
  remove(@Param('id') id: string, @Req() request: RequestWithUser) {
    return this.schoolsService.remove(id, request.user);
  }
}
