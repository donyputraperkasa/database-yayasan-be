import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'donyputraperkasa@gmail.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: '240119' })
  @IsString()
  password!: string;
}
