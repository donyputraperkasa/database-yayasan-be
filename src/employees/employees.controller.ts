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
import { EmployeeType, Role } from '../common/enums/role.enum';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { AuthUser } from '../common/types/auth-user.type';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { EmployeesService } from './employees.service';

type RequestWithUser = Request & {
  user: AuthUser;
};

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
