import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  IsArray,
  ValidateNested,
  Min,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';

class PurchaseItemDto {
  @ApiProperty()
  @IsString()
  nameAr!: string;

  @ApiProperty()
  @IsNumber()
  @Min(1)
  qty!: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  unitPrice!: number;
}

export class SubmitPurchaseDto {
  @ApiProperty()
  @IsString()
  departmentId!: string;

  @ApiProperty({ enum: ['EQUIPMENT', 'TRAINING_NEEDS', 'MAINTENANCE', 'INSURANCE', 'COMMUNITY_CENTER', 'OTHER'] })
  @IsEnum(['EQUIPMENT', 'TRAINING_NEEDS', 'MAINTENANCE', 'INSURANCE', 'COMMUNITY_CENTER', 'OTHER'] as const)
  type!: 'EQUIPMENT' | 'TRAINING_NEEDS' | 'MAINTENANCE' | 'INSURANCE' | 'COMMUNITY_CENTER' | 'OTHER';

  @ApiProperty()
  @IsString()
  description!: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  amount!: number;

  @ApiProperty({ type: [PurchaseItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PurchaseItemDto)
  items!: PurchaseItemDto[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  vendorName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  expectedDate?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  budgetId?: string;
}
