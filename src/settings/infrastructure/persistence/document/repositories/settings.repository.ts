import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SettingsSchemaClass } from '../entities/settings.schema';
import { Settings, SquarespacePayLink } from '../../../../domain/settings';

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
      // Map pay links domain → persistence (_id)
      const persist: any = { ...data };
      if (data.squarespacePayLinks) {
        persist.squarespacePayLinks = data.squarespacePayLinks.map((pl) => ({
          _id: pl.id,
          name: pl.name,
          productName: pl.productName,
          templateId: pl.templateId,
        }));
      }
      Object.assign(doc, persist);
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
    s.paymentMode = (raw.paymentMode as Settings['paymentMode']) || 'sandbox';
    s.paymentGateway =
      (raw.paymentGateway as Settings['paymentGateway']) || 'stripe';
    s.stripeSecretKey = raw.stripeSecretKey || '';
    s.stripeWebhookSecret = raw.stripeWebhookSecret || '';
    s.squarespaceApiKey = raw.squarespaceApiKey || '';
    s.squarespacePollingInterval = raw.squarespacePollingInterval || 30;
    s.squarespacePayLinks = (raw.squarespacePayLinks || []).map((pl) => {
      const link = new SquarespacePayLink();
      link.id = (pl as any)._id || (pl as any).id;
      link.name = pl.name;
      link.productName = pl.productName;
      link.templateId = pl.templateId;
      return link;
    });
    s.squarespaceLastPollAt = raw.squarespaceLastPollAt;
    s.updatedAt = raw.updatedAt;
    return s;
  }
}
