import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { now, HydratedDocument } from 'mongoose';
import { EntityDocumentHelper } from '../../../../../utils/document-entity-helper';

export type GiftCardTemplateSchemaDocument =
  HydratedDocument<GiftCardTemplateSchemaClass>;

@Schema({ _id: false })
export class CodePositionSchema {
  @Prop({ required: true })
  x: number;

  @Prop({ required: true })
  y: number;

  @Prop({ required: true })
  width: number;

  @Prop({ required: true })
  height: number;

  @Prop()
  fontSize?: number;

  @Prop({ default: '#000000' })
  fontColor?: string;

  @Prop({ default: 'center' })
  alignment?: string;
}

export const CodePositionSchemaDefinition =
  SchemaFactory.createForClass(CodePositionSchema);

@Schema({
  timestamps: true,
  toJSON: { virtuals: true, getters: true },
})
export class GiftCardTemplateSchemaClass extends EntityDocumentHelper {
  @Prop({ required: true })
  name: string;

  @Prop({ default: '' })
  description: string;

  @Prop({ required: true })
  image: string;

  @Prop({ type: CodePositionSchemaDefinition, required: true })
  codePosition: CodePositionSchema;

  @Prop({ default: 'full', enum: ['partial', 'full'] })
  redemptionType: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ required: true })
  createdBy: string;

  @Prop({ default: now })
  createdAt: Date;

  @Prop({ default: now })
  updatedAt: Date;

  @Prop({ default: null })
  deletedAt?: Date;
}

export const GiftCardTemplateSchema = SchemaFactory.createForClass(
  GiftCardTemplateSchemaClass,
);

GiftCardTemplateSchema.index({ isActive: 1 });
GiftCardTemplateSchema.index({ createdAt: -1 });
