import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CreateDocumentDto {
  @ApiPropertyOptional({
    description:
      'Wajib untuk owner. Untuk role school akan memakai schoolId dari token.',
    example: 'clx123schoolid',
  })
  @IsOptional()
  @IsString()
  schoolId?: string;

  @ApiProperty({ example: 'laporan sekolah' })
  @IsString()
  name!: string;
}

export class UpdateDocumentDto extends PartialType(CreateDocumentDto) {}
