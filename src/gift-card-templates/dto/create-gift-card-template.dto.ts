import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
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
}
