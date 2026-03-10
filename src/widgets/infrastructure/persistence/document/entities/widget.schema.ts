import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { now, HydratedDocument } from 'mongoose';
import { EntityDocumentHelper } from '../../../../../utils/document-entity-helper';

export type WidgetSchemaDocument = HydratedDocument<WidgetSchemaClass>;

@Schema({ _id: false })
export class WidgetCustomizationSchema {
  @Prop({ required: true })
  primaryColor: string;

  @Prop()
  secondaryColor?: string;

  @Prop()
  backgroundColor?: string;

  @Prop()
  textColor?: string;

  @Prop()
  fieldLabelColor?: string;

  @Prop()
  fieldTextColor?: string;

  @Prop({ required: true })
  buttonText: string;

  @Prop()
  logoUrl?: string;

  @Prop()
  headerText?: string;

  @Prop()
  footerText?: string;

  @Prop()
  titleDisplay?: string;
}

export const WidgetCustomizationSchemaDefinition = SchemaFactory.createForClass(
  WidgetCustomizationSchema,
);

@Schema({
  timestamps: true,
  toJSON: { virtuals: true, getters: true },
})
export class WidgetSchemaClass extends EntityDocumentHelper {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  templateId: string;

  @Prop({ required: true, unique: true, index: true })
  apiKey: string;

  @Prop({ type: [String], default: [] })
  allowedDomains: string[];

  @Prop({ type: WidgetCustomizationSchemaDefinition, required: true })
  customization: WidgetCustomizationSchema;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ required: true })
  createdBy: string;

  @Prop({ default: now })
  createdAt: Date;

  @Prop({ default: now })
  updatedAt: Date;
}

export const WidgetSchema = SchemaFactory.createForClass(WidgetSchemaClass);
