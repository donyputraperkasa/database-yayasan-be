import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString } from 'class-validator';

export class CreateContactDto {
  @ApiPropertyOptional({
    description:
      'Opsional. Role school akan otomatis memakai schoolId dari token.',
    example: 'clx123schoolid',
  })
  @IsOptional()
  @IsString()
  schoolId?: string;

  @ApiProperty({ example: 'Admin Sekolah' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'admin@sekolah.sch.id' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: 'Mohon bantuan untuk validasi dokumen sekolah.' })
  @IsString()
  message: string;
}
