import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdateSchoolEditAccessDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  canEdit!: boolean;
}
