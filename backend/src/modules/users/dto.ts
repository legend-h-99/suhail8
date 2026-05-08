import { ApiProperty, PartialType } from '@nestjs/swagger';
import {
  IsArray,
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @ApiProperty()
  @IsEmail()
  email!: string;

  @ApiProperty()
  @IsString()
  @MaxLength(200)
  fullNameAr!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  fullNameEn?: string;

  @ApiProperty()
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  nationalId?: string;

  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  roleCodes?: string[];
}

export class UpdateUserDto extends PartialType(CreateUserDto) {}

export class AssignRoleDto {
  @ApiProperty()
  @IsString()
  roleCode!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  scopeType?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  scopeId?: string;
}
