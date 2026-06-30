import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class BootstrapOwnerDto {
  @ApiProperty({ example: 'dony putra perkasa' })
  @IsString()
  name!: string;

  @ApiProperty({ example: 'donyputraperkasa@gmail.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: '240119', minLength: 6 })
  @IsString()
  @MinLength(6)
  password!: string;
}
