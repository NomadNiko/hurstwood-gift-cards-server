import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class Settings {
  @ApiProperty({ type: String })
  id: string;

  @ApiProperty({ enum: ['GBP', 'EUR', 'USD'], example: 'GBP' })
  currency: 'GBP' | 'EUR' | 'USD';

  @ApiProperty({ enum: ['partial', 'full'], example: 'full' })
  defaultRedemptionType: 'partial' | 'full';

  @ApiProperty({ type: [String], example: ['manager@example.com'] })
  notificationEmails: string[];

  @ApiProperty()
  updatedAt: Date;
}
