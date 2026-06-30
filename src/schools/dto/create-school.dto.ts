import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';
import { SchoolLevel } from '../../common/enums/role.enum';

export class CreateSchoolDto {
  @ApiProperty({ example: 'SMA Yogyakarta' })
  @IsString()
  name!: string;

  @ApiProperty({ enum: SchoolLevel, example: SchoolLevel.SMA_SMK })
  @IsEnum(SchoolLevel)
  level!: SchoolLevel;

  @ApiPropertyOptional({ example: 'Jalan Yogyakarta Istimewa' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: '0274123456' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'smayogyakarta@mail.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: 'kepala sekolah' })
  @IsOptional()
  @IsString()
  principal?: string;
}
