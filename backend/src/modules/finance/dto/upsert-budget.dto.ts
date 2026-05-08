import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, Min } from 'class-validator';

export class UpsertBudgetDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  departmentId?: string;

  @ApiProperty({ example: '1446' })
  @IsString()
  fiscalYear!: string;

  @ApiProperty({ example: 'عمليات' })
  @IsString()
  category!: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  allocated!: number;
}
