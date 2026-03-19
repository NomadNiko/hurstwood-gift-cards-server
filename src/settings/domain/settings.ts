import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SquarespacePayLink {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  productName: string;

  @ApiProperty()
  templateId: string;
}

export class Settings {
  @ApiProperty({ type: String })
  id: string;

  @ApiProperty({ enum: ['GBP', 'EUR', 'USD'], example: 'GBP' })
  currency: 'GBP' | 'EUR' | 'USD';

  @ApiProperty({ enum: ['partial', 'full'], example: 'full' })
  defaultRedemptionType: 'partial' | 'full';

  @ApiProperty({ type: [String], example: ['manager@example.com'] })
  notificationEmails: string[];

  @ApiProperty({ enum: ['sandbox', 'production'], example: 'sandbox' })
  paymentMode: 'sandbox' | 'production';

  @ApiProperty({
    enum: ['stripe', 'square', 'squarespace'],
    example: 'stripe',
  })
  paymentGateway: 'stripe' | 'square' | 'squarespace';

  @ApiPropertyOptional()
  stripeSecretKey?: string;

  @ApiPropertyOptional()
  stripeWebhookSecret?: string;

  @ApiPropertyOptional()
  squarespaceApiKey?: string;

  @ApiPropertyOptional()
  squarespacePollingInterval?: number;

  @ApiPropertyOptional({ type: [SquarespacePayLink] })
  squarespacePayLinks?: SquarespacePayLink[];

  @ApiPropertyOptional()
  squarespaceLastPollAt?: Date;

  @ApiProperty()
  updatedAt: Date;
}
