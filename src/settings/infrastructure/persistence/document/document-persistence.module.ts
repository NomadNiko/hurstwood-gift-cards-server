import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  SettingsSchemaClass,
  SettingsSchema,
} from './entities/settings.schema';
import { SettingsRepository } from './repositories/settings.repository';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SettingsSchemaClass.name, schema: SettingsSchema },
    ]),
  ],
  providers: [SettingsRepository],
  exports: [SettingsRepository],
})
export class DocumentSettingsPersistenceModule {}
