import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class UnredeemGiftCardDto {
  @ApiProperty()
  @IsString()
  redemptionId: string;
}
