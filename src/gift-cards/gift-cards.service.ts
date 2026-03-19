import {
  HttpStatus,
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';
import { GiftCardRepository } from './infrastructure/persistence/gift-card.repository';
import { GiftCard, Redemption } from './domain/gift-card';
import { CreateGiftCardDto } from './dto/create-gift-card.dto';
import { RedeemGiftCardDto } from './dto/redeem-gift-card.dto';
import { NullableType } from '../utils/types/nullable.type';
import { IPaginationOptions } from '../utils/types/pagination-options';
import { SortGiftCardDto } from './dto/query-gift-card.dto';
import { generateGiftCardCode } from './utils/generate-code';
import { randomBytes } from 'crypto';
import { MailService } from '../mail/mail.service';
import { GiftCardTemplatesService } from '../gift-card-templates/gift-card-templates.service';
import { SettingsService } from '../settings/settings.service';
import { CURRENCY_SYMBOLS } from '../settings/settings.service';

@Injectable()
export class GiftCardsService {
  constructor(
    private readonly repository: GiftCardRepository,
    private readonly mailService: MailService,
    private readonly templatesService: GiftCardTemplatesService,
    private readonly settingsService: SettingsService,
  ) {}

  async purchase(
    dto: CreateGiftCardDto,
    stripeSessionId?: string,
  ): Promise<GiftCard> {
    const template = await this.templatesService.findById(dto.templateId);
    const prefix = template?.codePrefix || 'GC';

    let code: string;
    do {
      code = generateGiftCardCode(prefix);
    } while (!(await this.repository.isCodeUnique(code)));

    const giftCard = await this.repository.create({
      code,
      templateId: dto.templateId,
      widgetId: dto.widgetId,
      originalAmount: dto.originalAmount,
      currentBalance: dto.originalAmount,
      purchaseDate: new Date(),
      purchaserEmail: dto.purchaserEmail,
      purchaserName: dto.purchaserName,
      recipientEmail: dto.recipientEmail,
      recipientName: dto.recipientName,
      status: 'active',
      redemptions: [],
      notes: dto.notes,
      stripeSessionId,
    });

    const settings = await this.settingsService.get();
    const currencySymbol = CURRENCY_SYMBOLS[settings.currency] || '£';
    const bcc = settings.notificationEmails || [];

    // Look up template for email visual — already fetched above

    const emailData = {
      code: giftCard.code,
      amount: giftCard.originalAmount,
      currencySymbol,
      currencyCode: settings.currency,
      purchaserName: dto.purchaserName,
      recipientName: dto.recipientName,
      notes: dto.notes,
      expirationDate: template?.expirationDate,
      templateImage: template?.image,
      codePosition: template?.codePosition,
      qrPosition: template?.qrPosition,
    };

    // Send email to purchaser (BCC notification list)
    await this.mailService
      .giftCardPurchase({ to: dto.purchaserEmail, data: emailData }, bcc)
      .catch(() => {});

    // If there's a separate recipient, email them too (BCC notification list)
    if (dto.recipientEmail && dto.recipientEmail !== dto.purchaserEmail) {
      await this.mailService
        .giftCardPurchase(
          { to: dto.recipientEmail, data: emailData },
          bcc,
          true,
        )
        .catch(() => {});
    }

    // Send purchase notification to email list
    if (bcc.length) {
      await this.mailService
        .giftCardPurchaseNotification({
          to: bcc,
          code: giftCard.code,
          amount: giftCard.originalAmount,
          currencySymbol,
          purchaserName: dto.purchaserName,
          purchaserEmail: dto.purchaserEmail,
          recipientName: dto.recipientName,
        })
        .catch(() => {});
    }

    return giftCard;
  }

  findByStripeSessionId(sessionId: string): Promise<NullableType<GiftCard>> {
    return this.repository.findByStripeSessionId(sessionId);
  }

  findManyWithPagination(params: {
    filterOptions?: { status?: string; templateId?: string } | null;
    sortOptions?: SortGiftCardDto[] | null;
    paginationOptions: IPaginationOptions;
  }): Promise<GiftCard[]> {
    return this.repository.findManyWithPagination(params);
  }

  findById(id: string): Promise<NullableType<GiftCard>> {
    return this.repository.findById(id);
  }

  async findByCode(code: string): Promise<NullableType<GiftCard>> {
    const giftCard = await this.repository.findByCode(code);
    if (giftCard) {
      await this.checkExpiration(giftCard);
    }
    return giftCard;
  }

  async findByEmail(email: string): Promise<GiftCard[]> {
    const cards = await this.repository.findByEmail(email);
    for (const card of cards) {
      await this.checkExpiration(card);
    }
    return cards;
  }

  private async checkExpiration(giftCard: GiftCard): Promise<void> {
    if (
      giftCard.status !== 'fully_redeemed' &&
      giftCard.status !== 'cancelled' &&
      giftCard.currentBalance > 0
    ) {
      const template = await this.templatesService.findById(
        giftCard.templateId,
      );
      if (
        template?.expirationDate &&
        new Date() > new Date(template.expirationDate)
      ) {
        await this.repository.update(giftCard.id, {
          currentBalance: 0,
          status: 'fully_redeemed',
        });
        giftCard.currentBalance = 0;
        giftCard.status = 'fully_redeemed';
      }
    }
  }

  async redeem(
    id: string,
    dto: RedeemGiftCardDto,
    userId: string,
  ): Promise<GiftCard> {
    const giftCard = await this.repository.findById(id);

    if (!giftCard) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: { id: 'giftCardNotFound' },
      });
    }

    if (
      giftCard.status === 'fully_redeemed' ||
      giftCard.status === 'cancelled'
    ) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: { status: 'giftCardNotRedeemable' },
      });
    }

    // Look up template to determine redemption type and expiration
    const template = await this.templatesService.findById(giftCard.templateId);

    if (
      template?.expirationDate &&
      new Date() > new Date(template.expirationDate)
    ) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: { status: 'giftCardExpired' },
      });
    }

    const isFullRedemption = !template || template.redemptionType === 'full';

    const redeemAmount = isFullRedemption
      ? giftCard.currentBalance
      : (dto.amount ?? giftCard.currentBalance);

    if (redeemAmount > giftCard.currentBalance) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: { amount: 'amountExceedsBalance' },
      });
    }

    const remainingBalance = isFullRedemption
      ? 0
      : Math.round((giftCard.currentBalance - redeemAmount) * 100) / 100;

    const redemption: Redemption = {
      id: randomBytes(12).toString('hex'),
      amount: redeemAmount,
      redeemedBy: userId,
      redeemedAt: new Date(),
      notes: dto.notes,
      remainingBalance,
    };

    const newStatus =
      remainingBalance === 0 ? 'fully_redeemed' : 'partially_redeemed';

    const updated = await this.repository.update(id, {
      currentBalance: remainingBalance,
      status: newStatus as GiftCard['status'],
      redemptions: [...giftCard.redemptions, redemption],
    });

    if (!updated) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: { id: 'updateFailed' },
      });
    }

    return updated;
  }

  async cancel(id: string): Promise<GiftCard | null> {
    return this.repository.update(id, { status: 'cancelled' });
  }

  async unredeem(
    id: string,
    redemptionId: string,
    userId: string,
  ): Promise<GiftCard> {
    const giftCard = await this.repository.findById(id);

    if (!giftCard) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: { id: 'giftCardNotFound' },
      });
    }

    const redemption = giftCard.redemptions.find((r) => r.id === redemptionId);

    if (!redemption) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: { redemptionId: 'redemptionNotFound' },
      });
    }

    if (redemption.reversed) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: { redemptionId: 'alreadyReversed' },
      });
    }

    redemption.reversed = true;
    redemption.reversedAt = new Date();
    redemption.reversedBy = userId;

    const newBalance =
      Math.round((giftCard.currentBalance + redemption.amount) * 100) / 100;

    const activeRedemptions = giftCard.redemptions.filter((r) => !r.reversed);
    const newStatus: GiftCard['status'] =
      activeRedemptions.length === 0
        ? 'active'
        : newBalance === 0
          ? 'fully_redeemed'
          : 'partially_redeemed';

    const updated = await this.repository.update(id, {
      currentBalance: newBalance,
      status: newStatus,
      redemptions: giftCard.redemptions,
    });

    if (!updated) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: { id: 'updateFailed' },
      });
    }

    return updated;
  }
}
