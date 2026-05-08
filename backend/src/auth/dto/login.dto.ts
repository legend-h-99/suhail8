import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'dean@cci-riyadh.edu.sa' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'P@ssword123' })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiProperty({ example: 'cci-riyadh', required: false })
  @IsOptional()
  @IsString()
  tenantSlug?: string;
}
