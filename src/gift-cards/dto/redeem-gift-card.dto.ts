import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class RedeemGiftCardDto {
  @ApiPropertyOptional({ example: 25.5 })
  @IsOptional()
  @IsNumber()
  @Min(0.01)
  amount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
