import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';
import { DocumentSettingsPersistenceModule } from './infrastructure/persistence/document/document-persistence.module';

@Module({
  imports: [DocumentSettingsPersistenceModule, EventEmitterModule.forRoot()],
  controllers: [SettingsController],
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule {}
