import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class Redemption {
  @ApiProperty({ type: String })
  id: string;

  @ApiProperty()
  amount: number;

  @ApiProperty({ type: String })
  redeemedBy: string;

  @ApiProperty()
  redeemedAt: Date;

  @ApiPropertyOptional()
  notes?: string;

  @ApiProperty()
  remainingBalance: number;

  @ApiPropertyOptional()
  reversed?: boolean;

  @ApiPropertyOptional()
  reversedAt?: Date;

  @ApiPropertyOptional()
  reversedBy?: string;
}

export class GiftCard {
  @ApiProperty({ type: String })
  id: string;

  @ApiProperty({ example: 'GC-ABCD-EFGH-JKLM' })
  code: string;

  @ApiProperty({ type: String })
  templateId: string;

  @ApiPropertyOptional({ type: String })
  widgetId?: string;

  @ApiProperty({ example: 50 })
  originalAmount: number;

  @ApiProperty({ example: 50 })
  currentBalance: number;

  @ApiProperty()
  purchaseDate: Date;

  @ApiProperty({ example: 'john@example.com' })
  purchaserEmail: string;

  @ApiProperty({ example: 'John Doe' })
  purchaserName: string;

  @ApiPropertyOptional()
  recipientEmail?: string;

  @ApiPropertyOptional()
  recipientName?: string;

  @ApiProperty({
    enum: ['active', 'partially_redeemed', 'fully_redeemed', 'cancelled'],
  })
  status: 'active' | 'partially_redeemed' | 'fully_redeemed' | 'cancelled';

  @ApiProperty({ type: [Redemption] })
  redemptions: Redemption[];

  @ApiPropertyOptional()
  notes?: string;

  @ApiPropertyOptional()
  stripeSessionId?: string;

  @ApiPropertyOptional()
  squarespaceOrderId?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
