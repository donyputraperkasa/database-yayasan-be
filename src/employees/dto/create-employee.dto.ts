import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { EmployeeType, Gender, Status } from '../../common/enums/role.enum';

export class CreateEmployeeDto {
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

  @ApiProperty({ enum: EmployeeType, example: EmployeeType.GURU })
  @IsEnum(EmployeeType)
  type!: EmployeeType;

  @ApiPropertyOptional({ example: 'Guru Matematika' })
  @IsOptional()
  @IsString()
  position?: string;

  @ApiPropertyOptional({ example: 'Yogyakarta, 09 Agustus 2003' })
  @IsOptional()
  @IsString()
  birthPlaceDate?: string;

  @ApiPropertyOptional({ example: 'S1 Matematika' })
  @IsOptional()
  @IsString()
  lastEducation?: string;

  @ApiPropertyOptional({ enum: Gender, example: Gender.MALE })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @ApiPropertyOptional({ enum: Status, example: Status.TETAP })
  @IsOptional()
  @IsEnum(Status)
  status?: Status;

  @ApiPropertyOptional({ example: 'jalan bantul yogyakarta' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: 'https://example.com/foto-pegawai.jpg' })
  @IsOptional()
  @IsString()
  photoUrl?: string;
}
