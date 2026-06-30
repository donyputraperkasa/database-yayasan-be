import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateSchoolProfileDto {
  @ApiPropertyOptional({
    example:
      'SMA BOPKRI 1 Yogyakarta adalah sekolah menengah atas yang berfokus pada pendidikan karakter, akademik, dan pelayanan.',
  })
  @IsOptional()
  @IsString()
  history?: string;

  @ApiPropertyOptional({
    example: 'Menjadi sekolah unggul dalam iman, ilmu, dan karakter.',
  })
  @IsOptional()
  @IsString()
  vision?: string;

  @ApiPropertyOptional({
    example: 'Menyelenggarakan pendidikan yang berkualitas dan berkarakter.',
  })
  @IsOptional()
  @IsString()
  mission?: string;

  @ApiPropertyOptional({ example: 'Berilmu, beriman, melayani' })
  @IsOptional()
  @IsString()
  motto?: string;

  @ApiPropertyOptional({ example: 'https://example.com/foto-sekolah.jpg' })
  @IsOptional()
  @IsString()
  photoUrl?: string;
}
