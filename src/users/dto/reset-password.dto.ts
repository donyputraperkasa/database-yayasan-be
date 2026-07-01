import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({ example: 'passwordBaru123', minLength: 6 })
  @IsString()
  @MinLength(6)
  newPassword: string;
}
