import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({ example: 'passwordLama123', minLength: 6 })
  @IsString()
  @MinLength(6)
  oldPassword: string;

  @ApiProperty({ example: 'passwordBaru123', minLength: 6 })
  @IsString()
  @MinLength(6)
  newPassword: string;
}
