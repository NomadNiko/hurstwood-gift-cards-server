import { Module } from '@nestjs/common';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';
import { DocumentSettingsPersistenceModule } from './infrastructure/persistence/document/document-persistence.module';

@Module({
  imports: [DocumentSettingsPersistenceModule],
  controllers: [SettingsController],
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule {}
