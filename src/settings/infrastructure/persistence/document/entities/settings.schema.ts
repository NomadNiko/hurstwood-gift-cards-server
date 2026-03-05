import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, now } from 'mongoose';
import { EntityDocumentHelper } from '../../../../../utils/document-entity-helper';

export type SettingsSchemaDocument = HydratedDocument<SettingsSchemaClass>;

@Schema({ timestamps: true, toJSON: { virtuals: true, getters: true } })
export class SettingsSchemaClass extends EntityDocumentHelper {
  @Prop({ default: 'GBP', enum: ['GBP', 'EUR', 'USD'] })
  currency: string;

  @Prop({ default: 'full', enum: ['partial', 'full'] })
  defaultRedemptionType: string;

  @Prop({ type: [String], default: [] })
  notificationEmails: string[];

  @Prop({ default: now })
  updatedAt: Date;
}

export const SettingsSchema =
  SchemaFactory.createForClass(SettingsSchemaClass);
