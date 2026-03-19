import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { now, HydratedDocument } from 'mongoose';
import { EntityDocumentHelper } from '../../../../../utils/document-entity-helper';

export type GiftCardSchemaDocument = HydratedDocument<GiftCardSchemaClass>;

@Schema({ _id: true, timestamps: false })
export class RedemptionSchema {
  @Prop()
  _id: string;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true })
  redeemedBy: string;

  @Prop({ default: now })
  redeemedAt: Date;

  @Prop()
  notes?: string;

  @Prop({ required: true })
  remainingBalance: number;

  @Prop()
  reversed?: boolean;

  @Prop()
  reversedAt?: Date;

  @Prop()
  reversedBy?: string;
}

export const RedemptionSchemaDefinition =
  SchemaFactory.createForClass(RedemptionSchema);

@Schema({
  timestamps: true,
  toJSON: { virtuals: true, getters: true },
})
export class GiftCardSchemaClass extends EntityDocumentHelper {
  @Prop({ required: true, unique: true, index: true })
  code: string;

  @Prop({ required: true })
  templateId: string;

  @Prop()
  widgetId?: string;

  @Prop({ required: true })
  originalAmount: number;

  @Prop({ required: true })
  currentBalance: number;

  @Prop({ default: now })
  purchaseDate: Date;

  @Prop({ required: true, index: true })
  purchaserEmail: string;

  @Prop({ required: true })
  purchaserName: string;

  @Prop()
  recipientEmail?: string;

  @Prop()
  recipientName?: string;

  @Prop({
    default: 'active',
    index: true,
  })
  status: string;

  @Prop({ type: [RedemptionSchemaDefinition], default: [] })
  redemptions: RedemptionSchema[];

  @Prop()
  notes?: string;

  @Prop()
  stripeSessionId?: string;

  @Prop({ index: true })
  squarespaceOrderId?: string;

  @Prop({ default: now })
  createdAt: Date;

  @Prop({ default: now })
  updatedAt: Date;
}

export const GiftCardSchema = SchemaFactory.createForClass(GiftCardSchemaClass);

GiftCardSchema.index({ purchaseDate: -1 });
