import { Module } from '@nestjs/common';
import { GiftCardsController } from './gift-cards.controller';
import { GiftCardsService } from './gift-cards.service';
import { DocumentGiftCardPersistenceModule } from './infrastructure/persistence/document/document-persistence.module';
import { MailModule } from '../mail/mail.module';
import { GiftCardTemplatesModule } from '../gift-card-templates/gift-card-templates.module';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [
    DocumentGiftCardPersistenceModule,
    MailModule,
    GiftCardTemplatesModule,
    SettingsModule,
  ],
  controllers: [GiftCardsController],
  providers: [GiftCardsService],
  exports: [GiftCardsService],
})
export class GiftCardsModule {}
