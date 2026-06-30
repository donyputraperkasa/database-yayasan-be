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
import { FinanceType, Role } from '../common/enums/role.enum';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { AuthUser } from '../common/types/auth-user.type';
import { CreateFinanceDto } from './dto/create-finance.dto';
import { UpdateFinanceDto } from './dto/update-finance.dto';
import { FinancesService } from './finances.service';

type RequestWithUser = Request & {
  user: AuthUser;
};

@ApiTags('Finances')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('finances')
export class FinancesController {
  constructor(private readonly financesService: FinancesService) {}

  @Roles(Role.OWNER, Role.SCHOOL)
  @Post()
  create(@Body() dto: CreateFinanceDto, @Req() request: RequestWithUser) {
    return this.financesService.create(dto, request.user);
  }

  @Roles(Role.OWNER, Role.OFFICE, Role.SCHOOL)
  @ApiQuery({ name: 'schoolId', required: false })
  @ApiQuery({ name: 'type', required: false, enum: FinanceType })
  @ApiQuery({ name: 'className', required: false })
  @Get()
  findAll(
    @Req() request: RequestWithUser,
    @Query('schoolId') schoolId?: string,
    @Query('type') type?: FinanceType,
    @Query('className') className?: string,
  ) {
    return this.financesService.findAll(
      request.user,
      schoolId,
      type,
      className,
    );
  }

  @Roles(Role.OWNER, Role.OFFICE, Role.SCHOOL)
  @Get(':id')
  findById(@Param('id') id: string, @Req() request: RequestWithUser) {
    return this.financesService.findById(id, request.user);
  }

  @Roles(Role.OWNER, Role.SCHOOL)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateFinanceDto,
    @Req() request: RequestWithUser,
  ) {
    return this.financesService.update(id, dto, request.user);
  }

  @Roles(Role.OWNER, Role.SCHOOL)
  @Delete(':id')
  remove(@Param('id') id: string, @Req() request: RequestWithUser) {
    return this.financesService.remove(id, request.user);
  }
}
