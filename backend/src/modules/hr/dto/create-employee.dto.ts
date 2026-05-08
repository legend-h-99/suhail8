import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  IsEmail,
} from 'class-validator';

export class CreateEmployeeDto {
  @ApiProperty()
  @IsString()
  employeeNumber!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  nationalId?: string;

  @ApiProperty()
  @IsString()
  fullNameAr!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  fullNameEn?: string;

  @ApiProperty({ enum: ['MALE', 'FEMALE'] })
  @IsEnum(['MALE', 'FEMALE'] as const)
  gender!: 'MALE' | 'FEMALE';

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  birthDate?: string;

  @ApiProperty()
  @IsDateString()
  hireDate!: string;

  @ApiProperty({ enum: ['PERMANENT', 'TEMPORARY', 'CONTRACT', 'VOLUNTEER'], required: false })
  @IsOptional()
  @IsEnum(['PERMANENT', 'TEMPORARY', 'CONTRACT', 'VOLUNTEER'] as const)
  contractType?: 'PERMANENT' | 'TEMPORARY' | 'CONTRACT' | 'VOLUNTEER';

  @ApiProperty()
  @IsString()
  jobTitleAr!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  departmentId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  userId?: string;
}
