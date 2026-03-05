import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SettingsSchemaClass } from '../entities/settings.schema';
import { Settings } from '../../../../domain/settings';

@Injectable()
export class SettingsRepository {
  constructor(
    @InjectModel(SettingsSchemaClass.name)
    private readonly model: Model<SettingsSchemaClass>,
  ) {}

  async get(): Promise<Settings> {
    let doc = await this.model.findOne().exec();
    if (!doc) {
      doc = await this.model.create({});
    }
    return this.toDomain(doc);
  }

  async update(data: Partial<Settings>): Promise<Settings> {
    let doc = await this.model.findOne().exec();
    if (!doc) {
      doc = await this.model.create(data);
    } else {
      Object.assign(doc, data);
      await doc.save();
    }
    return this.toDomain(doc);
  }

  private toDomain(raw: SettingsSchemaClass): Settings {
    const s = new Settings();
    s.id = raw._id.toString();
    s.currency = raw.currency as Settings['currency'];
    s.defaultRedemptionType =
      raw.defaultRedemptionType as Settings['defaultRedemptionType'];
    s.notificationEmails = raw.notificationEmails || [];
    s.updatedAt = raw.updatedAt;
    return s;
  }
}
