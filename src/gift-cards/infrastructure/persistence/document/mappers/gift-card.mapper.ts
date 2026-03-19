import { GiftCard, Redemption } from '../../../../domain/gift-card';
import {
  GiftCardSchemaClass,
  RedemptionSchema,
} from '../entities/gift-card.schema';

export class GiftCardMapper {
  static toDomain(raw: GiftCardSchemaClass): GiftCard {
    const domain = new GiftCard();
    domain.id = raw._id.toString();
    domain.code = raw.code;
    domain.templateId = raw.templateId;
    domain.widgetId = raw.widgetId;
    domain.originalAmount = raw.originalAmount;
    domain.currentBalance = raw.currentBalance;
    domain.purchaseDate = raw.purchaseDate;
    domain.purchaserEmail = raw.purchaserEmail;
    domain.purchaserName = raw.purchaserName;
    domain.recipientEmail = raw.recipientEmail;
    domain.recipientName = raw.recipientName;
    domain.status = raw.status as GiftCard['status'];
    domain.notes = raw.notes;
    domain.stripeSessionId = raw.stripeSessionId;
    domain.createdAt = raw.createdAt;
    domain.updatedAt = raw.updatedAt;

    domain.redemptions = (raw.redemptions || []).map((r) => {
      const redemption = new Redemption();
      redemption.id = r._id;
      redemption.amount = r.amount;
      redemption.redeemedBy = r.redeemedBy;
      redemption.redeemedAt = r.redeemedAt;
      redemption.notes = r.notes;
      redemption.remainingBalance = r.remainingBalance;
      redemption.reversed = r.reversed;
      redemption.reversedAt = r.reversedAt;
      redemption.reversedBy = r.reversedBy;
      return redemption;
    });

    return domain;
  }

  static toPersistence(domain: GiftCard): GiftCardSchemaClass {
    const persistence = new GiftCardSchemaClass();
    if (domain.id) {
      persistence._id = domain.id;
    }
    persistence.code = domain.code;
    persistence.templateId = domain.templateId;
    persistence.widgetId = domain.widgetId;
    persistence.originalAmount = domain.originalAmount;
    persistence.currentBalance = domain.currentBalance;
    persistence.purchaseDate = domain.purchaseDate;
    persistence.purchaserEmail = domain.purchaserEmail;
    persistence.purchaserName = domain.purchaserName;
    persistence.recipientEmail = domain.recipientEmail;
    persistence.recipientName = domain.recipientName;
    persistence.status = domain.status;
    persistence.notes = domain.notes;
    persistence.stripeSessionId = domain.stripeSessionId;
    persistence.createdAt = domain.createdAt;
    persistence.updatedAt = domain.updatedAt;

    persistence.redemptions = (domain.redemptions || []).map((r) => {
      const rs = new RedemptionSchema();
      rs._id = r.id;
      rs.amount = r.amount;
      rs.redeemedBy = r.redeemedBy;
      rs.redeemedAt = r.redeemedAt;
      rs.notes = r.notes;
      rs.remainingBalance = r.remainingBalance;
      rs.reversed = r.reversed;
      rs.reversedAt = r.reversedAt;
      rs.reversedBy = r.reversedBy;
      return rs;
    });

    return persistence;
  }
}
