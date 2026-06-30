import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { Role } from '../../common/enums/role.enum';

export class CreateUserDto {
  @ApiProperty({ example: 'dony putra perkasa' })
  @IsString()
  name!: string;

  @ApiProperty({ example: 'dony@mail.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123', minLength: 6 })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ enum: Role, example: Role.OWNER })
  @IsEnum(Role)
  role: Role;

  @ApiPropertyOptional({
    description: 'Diisi hanya untuk user role school',
    example: 'clx123schoolid',
  })
  @IsOptional()
  @IsString()
  schoolId?: string;
}
