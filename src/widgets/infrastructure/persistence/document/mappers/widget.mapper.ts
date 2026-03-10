import { Widget, WidgetCustomization } from '../../../../domain/widget';
import { WidgetSchemaClass } from '../entities/widget.schema';

export class WidgetMapper {
  static toDomain(raw: WidgetSchemaClass): Widget {
    const domain = new Widget();
    domain.id = raw._id.toString();
    domain.name = raw.name;
    domain.templateId = raw.templateId;
    domain.apiKey = raw.apiKey;
    domain.allowedDomains = raw.allowedDomains;
    domain.isActive = raw.isActive;
    domain.createdBy = raw.createdBy;
    domain.createdAt = raw.createdAt;
    domain.updatedAt = raw.updatedAt;

    if (raw.customization) {
      const c = new WidgetCustomization();
      c.primaryColor = raw.customization.primaryColor;
      c.secondaryColor = raw.customization.secondaryColor;
      c.backgroundColor = raw.customization.backgroundColor;
      c.textColor = raw.customization.textColor;
      c.fieldLabelColor = raw.customization.fieldLabelColor;
      c.fieldTextColor = raw.customization.fieldTextColor;
      c.buttonText = raw.customization.buttonText;
      c.logoUrl = raw.customization.logoUrl;
      c.headerText = raw.customization.headerText;
      c.footerText = raw.customization.footerText;
      c.titleDisplay = raw.customization.titleDisplay;
      domain.customization = c;
    }

    return domain;
  }

  static toPersistence(domain: Widget): WidgetSchemaClass {
    const persistence = new WidgetSchemaClass();
    if (domain.id) {
      persistence._id = domain.id;
    }
    persistence.name = domain.name;
    persistence.templateId = domain.templateId;
    persistence.apiKey = domain.apiKey;
    persistence.allowedDomains = domain.allowedDomains;
    persistence.customization = domain.customization;
    persistence.isActive = domain.isActive;
    persistence.createdBy = domain.createdBy;
    persistence.createdAt = domain.createdAt;
    persistence.updatedAt = domain.updatedAt;
    return persistence;
  }
}
