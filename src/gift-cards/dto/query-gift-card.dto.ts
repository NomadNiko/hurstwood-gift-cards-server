import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';
import { Transform, Type, plainToInstance } from 'class-transformer';
import { GiftCard } from '../domain/gift-card';

export class SortGiftCardDto {
  @Type(() => String)
  @IsString()
  orderBy: keyof GiftCard;

  @IsString()
  order: 'ASC' | 'DESC';
}

export class QueryGiftCardDto {
  @ApiPropertyOptional()
  @Transform(({ value }) => (value ? Number(value) : 1))
  @IsNumber()
  @IsOptional()
  page?: number;

  @ApiPropertyOptional()
  @Transform(({ value }) => (value ? Number(value) : 10))
  @IsNumber()
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  templateId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  isArchived?: boolean;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @Transform(({ value }) =>
    value ? plainToInstance(SortGiftCardDto, JSON.parse(value)) : undefined,
  )
  sort?: SortGiftCardDto[] | null;
}
