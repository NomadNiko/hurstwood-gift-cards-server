import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, now } from 'mongoose';
import { EntityDocumentHelper } from '../../../../../utils/document-entity-helper';

export type SettingsSchemaDocument = HydratedDocument<SettingsSchemaClass>;

@Schema({ _id: false })
export class SquarespacePayLinkSchema {
  @Prop({ required: true })
  _id: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  productName: string;

  @Prop({ required: true })
  templateId: string;
}

export const SquarespacePayLinkSchemaDefinition = SchemaFactory.createForClass(
  SquarespacePayLinkSchema,
);

@Schema({ timestamps: true, toJSON: { virtuals: true, getters: true } })
export class SettingsSchemaClass extends EntityDocumentHelper {
  @Prop({ default: 'GBP', enum: ['GBP', 'EUR', 'USD'] })
  currency: string;

  @Prop({ default: 'full', enum: ['partial', 'full'] })
  defaultRedemptionType: string;

  @Prop({ type: [String], default: [] })
  notificationEmails: string[];

  @Prop({ default: 'sandbox', enum: ['sandbox', 'production'] })
  paymentMode: string;

  @Prop({ default: 'stripe', enum: ['stripe', 'square', 'squarespace'] })
  paymentGateway: string;

  @Prop({ default: '' })
  stripeSecretKey: string;

  @Prop({ default: '' })
  stripeWebhookSecret: string;

  @Prop({ default: '' })
  squarespaceApiKey: string;

  @Prop({ default: 30 })
  squarespacePollingInterval: number;

  @Prop({ type: [SquarespacePayLinkSchemaDefinition], default: [] })
  squarespacePayLinks: SquarespacePayLinkSchema[];

  @Prop()
  squarespaceLastPollAt?: Date;

  @Prop({ default: now })
  updatedAt: Date;
}

export const SettingsSchema = SchemaFactory.createForClass(SettingsSchemaClass);
