import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
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
import { UpdateSchoolProfileDto } from './dto/update-school-profile.dto';
import { SchoolProfileService } from './school-profile.service';

type RequestWithUser = Request & {
  user: AuthUser;
};

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
}
