import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { FacilityCondition } from '../../common/enums/role.enum';

export class CreateFacilityDto {
  @ApiPropertyOptional({
    description:
      'Wajib untuk owner. Untuk role school akan memakai schoolId dari token.',
    example: 'clx123schoolid',
  })
  @IsOptional()
  @IsString()
  schoolId?: string;

  @ApiProperty({ example: 'Ruang Kelas' })
  @IsString()
  name!: string;

  @ApiProperty({ example: 12 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  quantity!: number;

  @ApiProperty({
    enum: FacilityCondition,
    example: FacilityCondition.BAIK,
  })
  @IsEnum(FacilityCondition)
  condition!: FacilityCondition;
}
