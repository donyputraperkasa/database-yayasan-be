import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { FinanceType } from '../../common/enums/role.enum';

export class CreateFinanceDto {
  @ApiPropertyOptional({
    description:
      'Wajib untuk owner. Untuk role school akan memakai schoolId dari token.',
    example: 'clx123schoolid',
  })
  @IsOptional()
  @IsString()
  schoolId?: string;

  @ApiProperty({ enum: FinanceType, example: FinanceType.SPP })
  @IsEnum(FinanceType)
  type!: FinanceType;

  @ApiPropertyOptional({
    description: 'Untuk SPP, isi kelas/tahun sesuai jenjang.',
    example: 'kelas_1',
  })
  @IsOptional()
  @IsString()
  className?: string;

  @ApiPropertyOptional({ example: 250000 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  amount?: number;

  @ApiPropertyOptional({ example: '1234567890' })
  @IsOptional()
  @IsString()
  accountNo?: string;

  @ApiPropertyOptional({ example: 15000000 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  balance?: number;

  @ApiPropertyOptional({ example: '2026-06-30' })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional({ example: 'Saldo BOS per akhir bulan' })
  @IsOptional()
  @IsString()
  note?: string;
}
