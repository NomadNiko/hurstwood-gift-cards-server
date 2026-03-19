import { Module } from '@nestjs/common';
import { SquarespaceService } from './squarespace.service';
import { SettingsModule } from '../settings/settings.module';
import { GiftCardsModule } from '../gift-cards/gift-cards.module';

@Module({
  imports: [SettingsModule, GiftCardsModule],
  providers: [SquarespaceService],
  exports: [SquarespaceService],
})
export class SquarespaceModule {}
