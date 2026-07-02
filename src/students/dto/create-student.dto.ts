import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Gender } from '../../common/enums/role.enum';

export class CreateStudentDto {
  @ApiPropertyOptional({
    description:
      'Wajib untuk owner. Untuk role school akan memakai schoolId dari token.',
    example: 'clx123schoolid',
  })
  @IsOptional()
  @IsString()
  schoolId?: string;

  @ApiProperty({ example: 'dony putra perkasa' })
  @IsString()
  name!: string;

  @ApiPropertyOptional({ example: 'Yogyakarta, 09 Agustus 2003' })
  @IsOptional()
  @IsString()
  birthPlaceDate?: string;

  @ApiPropertyOptional({ example: 'jalan yogyakaarta istimewa' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ enum: Gender, example: Gender.FEMALE })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @ApiPropertyOptional({ example: 'Kristen' })
  @IsOptional()
  @IsString()
  religion?: string;

  @ApiPropertyOptional({ example: 'Bapak Yohanes Pratama' })
  @IsOptional()
  @IsString()
  fatherName?: string;

  @ApiPropertyOptional({ example: 'Ibu Maria Lestari' })
  @IsOptional()
  @IsString()
  motherName?: string;

  @ApiPropertyOptional({ example: 'guru matematika' })
  @IsOptional()
  @IsString()
  fatherJob?: string;

  @ApiPropertyOptional({ example: 'guru matematika' })
  @IsOptional()
  @IsString()
  motherJob?: string;

  @ApiPropertyOptional({ example: '6A' })
  @IsOptional()
  @IsString()
  className?: string;

  @ApiPropertyOptional({ example: 250000 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sppAmount?: number;

  @ApiPropertyOptional({ example: 'https://example.com/foto-siswa.jpg' })
  @IsOptional()
  @IsString()
  photoUrl?: string;
}
