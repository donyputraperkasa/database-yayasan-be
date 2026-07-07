import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
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

  @ApiPropertyOptional({ example: 'Yogyakarta' })
  @IsOptional()
  @IsString()
  birthPlaceDate?: string;

  @ApiPropertyOptional({
    description: 'Tanggal lahir untuk menghitung tanggal pensiun.',
    example: '09 Agustus 2003',
  })
  @IsOptional()
  @IsDateString()
  birthDate?: string;

  @ApiPropertyOptional({ example: 'Kristen' })
  @IsOptional()
  @IsString()
  religion?: string;

  @ApiPropertyOptional({ example: 'jalan bantul yogyakarta' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: '08123456789' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'admin@sekolah.sch.id' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiProperty({ enum: EmployeeType, example: EmployeeType.GURU })
  @IsEnum(EmployeeType)
  type!: EmployeeType;

  @ApiPropertyOptional({ example: 'IT Programmer' })
  @IsOptional()
  @IsString()
  position?: string;

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

  @ApiPropertyOptional({ example: '123/SK/YYS/VII/2026' })
  @IsOptional()
  @IsString()
  decreeNumber?: string;

  @ApiPropertyOptional({
    description:
      'Tanggal masuk diisi manual. Masa kerja akan dihitung otomatis dari tanggal ini.',
    example: '2020-07-01',
  })
  @IsOptional()
  @IsDateString()
  joinDate?: string;

  @ApiPropertyOptional({ example: 'Wakil Kepala Sekolah' })
  @IsOptional()
  @IsString()
  otherPosition?: string;

  @ApiPropertyOptional({ example: '3500000' })
  @IsOptional()
  @IsString()
  fee?: string;

  @ApiPropertyOptional({ example: 'https://example.com/foto-pegawai.jpg' })
  @IsOptional()
  @IsString()
  photoUrl?: string;

  @ApiPropertyOptional({
    example: '/uploads/employees/decrees/sk-terakhir.jpg',
  })
  @IsOptional()
  @IsString()
  decreeUrl?: string;
}
