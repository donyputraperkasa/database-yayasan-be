import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateAssetDto {
  @ApiPropertyOptional({
    description:
      'Wajib untuk owner. Untuk role school akan memakai schoolId dari token.',
    example: 'clx123schoolid',
  })
  @IsOptional()
  @IsString()
  schoolId?: string;

  @ApiPropertyOptional({ example: '2500 m2' })
  @IsOptional()
  @IsString()
  landArea?: string;

  @ApiPropertyOptional({ example: 'Yayasan BOPKRI' })
  @IsOptional()
  @IsString()
  certificateOwner?: string;

  @ApiPropertyOptional({ example: 'Pembelian' })
  @IsOptional()
  @IsString()
  origin?: string;

  @ApiPropertyOptional({ example: 2018 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  procurementYear?: number;

  @ApiPropertyOptional({ example: '1200 m2' })
  @IsOptional()
  @IsString()
  buildingArea?: string;

  @ApiPropertyOptional({ example: 'https://example.com/foto-aset.jpg' })
  @IsOptional()
  @IsString()
  photoUrl?: string;
}
