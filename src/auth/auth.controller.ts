import {
  Body,
  Controller,
  Get,
  Headers,
  Patch,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { clearAuthCookie, setAuthCookie } from '../common/auth/auth-cookie';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AuthUser } from '../common/types/auth-user.type';
import { AuthService } from './auth.service';
import { BootstrapOwnerDto } from './dto/bootstrap-owner.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { LoginDto } from './dto/login.dto';

type RequestWithUser = Request & {
  user: AuthUser;
};

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const session = await this.authService.login(dto);
    setAuthCookie(response, session.accessToken);

    return { user: session.user };
  }

  @Post('bootstrap-owner')
  bootstrapOwner(
    @Body() dto: BootstrapOwnerDto,
    @Headers('x-bootstrap-secret') bootstrapSecret?: string,
  ) {
    return this.authService.bootstrapOwner(dto, bootstrapSecret);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@Req() request: RequestWithUser) {
    return request.user;
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch('change-password')
  async changePassword(
    @Req() request: RequestWithUser,
    @Body() dto: ChangePasswordDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.changePassword(request.user.sub, dto);
    clearAuthCookie(response);

    return result;
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(
    @Req() request: RequestWithUser,
    @Res({ passthrough: true }) response: Response,
  ) {
    await this.authService.logout(request.user);
    clearAuthCookie(response);

    return { message: 'Logout berhasil' };
  }
}
