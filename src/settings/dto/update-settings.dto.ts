import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEmail,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class SquarespacePayLinkDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsString()
  name: string;

  @IsString()
  productName: string;

  @IsString()
  templateId: string;
}

export class UpdateSettingsDto {
  @ApiPropertyOptional({ enum: ['GBP', 'EUR', 'USD'] })
  @IsOptional()
  @IsIn(['GBP', 'EUR', 'USD'])
  currency?: 'GBP' | 'EUR' | 'USD';

  @ApiPropertyOptional({ enum: ['partial', 'full'] })
  @IsOptional()
  @IsIn(['partial', 'full'])
  defaultRedemptionType?: 'partial' | 'full';

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsEmail({}, { each: true })
  notificationEmails?: string[];

  @ApiPropertyOptional({ enum: ['sandbox', 'production'] })
  @IsOptional()
  @IsIn(['sandbox', 'production'])
  paymentMode?: 'sandbox' | 'production';

  @ApiPropertyOptional({ enum: ['stripe', 'square', 'squarespace'] })
  @IsOptional()
  @IsIn(['stripe', 'square', 'squarespace'])
  paymentGateway?: 'stripe' | 'square' | 'squarespace';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  stripeSecretKey?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  stripeWebhookSecret?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  squarespaceApiKey?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(30)
  @Max(300)
  squarespacePollingInterval?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SquarespacePayLinkDto)
  squarespacePayLinks?: SquarespacePayLinkDto[];
}
