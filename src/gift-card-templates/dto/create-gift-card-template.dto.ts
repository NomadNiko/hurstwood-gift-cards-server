import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CodePositionDto {
  @ApiProperty({ example: 10 })
  @IsNumber()
  @Min(0)
  @Max(100)
  x: number;

  @ApiProperty({ example: 80 })
  @IsNumber()
  @Min(0)
  @Max(100)
  y: number;

  @ApiProperty({ example: 80 })
  @IsNumber()
  @Min(0)
  @Max(100)
  width: number;

  @ApiProperty({ example: 10 })
  @IsNumber()
  @Min(0)
  @Max(100)
  height: number;

  @ApiPropertyOptional({ example: 16 })
  @IsOptional()
  @IsNumber()
  fontSize?: number;

  @ApiPropertyOptional({ example: '#000000' })
  @IsOptional()
  @IsString()
  fontColor?: string;

  @ApiPropertyOptional({ enum: ['left', 'center', 'right'] })
  @IsOptional()
  @IsString()
  alignment?: 'left' | 'center' | 'right';
}

export class QrPositionDto {
  @ApiProperty({ example: 85 })
  @IsNumber()
  @Min(0)
  @Max(100)
  x: number;

  @ApiProperty({ example: 5 })
  @IsNumber()
  @Min(0)
  @Max(100)
  y: number;

  @ApiProperty({ example: 12 })
  @IsNumber()
  @Min(1)
  @Max(100)
  size: number;
}

export class CreateGiftCardTemplateDto {
  @ApiProperty({ example: 'Holiday Special' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 'A festive gift card template' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: '/api/v1/files/abc123' })
  @IsNotEmpty()
  @IsString()
  image: string;

  @ApiProperty({ type: CodePositionDto })
  @ValidateNested()
  @Type(() => CodePositionDto)
  codePosition: CodePositionDto;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ enum: ['partial', 'full'], example: 'full' })
  @IsOptional()
  @IsIn(['partial', 'full'])
  redemptionType?: 'partial' | 'full';

  @ApiPropertyOptional({ example: '2026-12-31' })
  @IsOptional()
  @ValidateIf((o) => o.expirationDate !== null)
  @IsDateString()
  expirationDate?: string | null;

  @ApiPropertyOptional({
    example: 12,
    description: 'Months after purchase date until expiration',
  })
  @IsOptional()
  @ValidateIf((o) => o.expirationMonths !== null)
  @IsNumber()
  @Min(1)
  expirationMonths?: number | null;

  @ApiPropertyOptional({
    example: 'GC',
    description: 'Prefix for generated gift card codes',
  })
  @IsOptional()
  @IsString()
  codePrefix?: string;

  @ApiPropertyOptional({ type: QrPositionDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => QrPositionDto)
  qrPosition?: QrPositionDto;
}
