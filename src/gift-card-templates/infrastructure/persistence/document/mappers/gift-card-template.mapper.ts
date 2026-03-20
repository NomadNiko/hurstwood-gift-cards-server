import {
  CodePosition,
  GiftCardTemplate,
} from '../../../../domain/gift-card-template';
import { GiftCardTemplateSchemaClass } from '../entities/gift-card-template.schema';

export class GiftCardTemplateMapper {
  static toDomain(raw: GiftCardTemplateSchemaClass): GiftCardTemplate {
    const domain = new GiftCardTemplate();
    domain.id = raw._id.toString();
    domain.name = raw.name;
    domain.description = raw.description;
    domain.image = raw.image;

    if (raw.codePosition) {
      const cp = new CodePosition();
      cp.x = raw.codePosition.x;
      cp.y = raw.codePosition.y;
      cp.width = raw.codePosition.width;
      cp.height = raw.codePosition.height;
      cp.fontSize = raw.codePosition.fontSize;
      cp.fontColor = raw.codePosition.fontColor;
      cp.alignment = raw.codePosition.alignment as CodePosition['alignment'];
      domain.codePosition = cp;
    }

    domain.isActive = raw.isActive;
    domain.redemptionType =
      (raw.redemptionType as 'partial' | 'full') || 'full';
    domain.expirationDate = raw.expirationDate || undefined;
    domain.expirationMonths = raw.expirationMonths ?? undefined;
    domain.codePrefix = raw.codePrefix || 'GC';
    domain.qrPosition = raw.qrPosition || undefined;
    domain.createdBy = raw.createdBy;
    domain.createdAt = raw.createdAt;
    domain.updatedAt = raw.updatedAt;
    domain.deletedAt = raw.deletedAt;
    return domain;
  }

  static toPersistence(domain: GiftCardTemplate): GiftCardTemplateSchemaClass {
    const persistence = new GiftCardTemplateSchemaClass();
    if (domain.id) {
      persistence._id = domain.id;
    }
    persistence.name = domain.name;
    persistence.description = domain.description;
    persistence.image = domain.image;
    persistence.codePosition = domain.codePosition;
    persistence.isActive = domain.isActive;
    persistence.redemptionType = domain.redemptionType;
    persistence.expirationDate = domain.expirationDate;
    persistence.expirationMonths = domain.expirationMonths;
    persistence.codePrefix = domain.codePrefix;
    persistence.qrPosition = domain.qrPosition;
    persistence.createdBy = domain.createdBy;
    persistence.createdAt = domain.createdAt;
    persistence.updatedAt = domain.updatedAt;
    persistence.deletedAt = domain.deletedAt;
    return persistence;
  }
}
