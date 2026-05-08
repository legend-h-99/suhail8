import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { DepartmentType } from '@prisma/client';

export class CreateDepartmentDto {
  @ApiProperty()
  @IsString()
  @MaxLength(50)
  code!: string;

  @ApiProperty()
  @IsString()
  @MaxLength(200)
  nameAr!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  nameEn?: string;

  @ApiProperty({ enum: DepartmentType })
  @IsEnum(DepartmentType)
  type!: DepartmentType;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  parentId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  managerId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  costCenter?: string;
}

export class UpdateDepartmentDto extends PartialType(CreateDepartmentDto) {}
