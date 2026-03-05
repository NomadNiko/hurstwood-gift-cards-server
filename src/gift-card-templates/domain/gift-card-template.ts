import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CodePosition {
  @ApiProperty({ example: 10, description: 'X coordinate as percentage (0-100)' })
  x: number;

  @ApiProperty({ example: 80, description: 'Y coordinate as percentage (0-100)' })
  y: number;

  @ApiProperty({ example: 80, description: 'Width as percentage (0-100)' })
  width: number;

  @ApiProperty({ example: 10, description: 'Height as percentage (0-100)' })
  height: number;

  @ApiPropertyOptional({ example: 16 })
  fontSize?: number;

  @ApiPropertyOptional({ example: '#000000' })
  fontColor?: string;

  @ApiPropertyOptional({ enum: ['left', 'center', 'right'], example: 'center' })
  alignment?: 'left' | 'center' | 'right';
}

export class GiftCardTemplate {
  @ApiProperty({ type: String })
  id: string;

  @ApiProperty({ type: String, example: 'Holiday Special' })
  name: string;

  @ApiProperty({ type: String, example: 'A festive gift card template' })
  description: string;

  @ApiProperty({ type: String })
  image: string;

  @ApiProperty({ type: () => CodePosition })
  codePosition: CodePosition;

  @ApiProperty({ enum: ['partial', 'full'], example: 'full' })
  redemptionType: 'partial' | 'full';

  @ApiProperty({ type: Boolean })
  isActive: boolean;

  @ApiProperty({ type: String })
  createdBy: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional()
  deletedAt?: Date;
}
