import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { I18nContext } from 'nestjs-i18n';
import { MailData } from './interfaces/mail-data.interface';

import { MaybeType } from '../utils/types/maybe.type';
import { MailerService } from '../mailer/mailer.service';
import path from 'path';
import { AllConfigType } from '../config/config.type';
import {
  generateGiftCardPdf,
  generateGiftCardImage,
} from '../gift-cards/utils/generate-gift-card-pdf';

@Injectable()
export class MailService {
  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService<AllConfigType>,
  ) {}

  async userSignUp(mailData: MailData<{ hash: string }>): Promise<void> {
    const i18n = I18nContext.current();
    let emailConfirmTitle: MaybeType<string>;
    let text1: MaybeType<string>;
    let text2: MaybeType<string>;
    let text3: MaybeType<string>;

    if (i18n) {
      [emailConfirmTitle, text1, text2, text3] = await Promise.all([
        i18n.t('common.confirmEmail'),
        i18n.t('confirm-email.text1'),
        i18n.t('confirm-email.text2'),
        i18n.t('confirm-email.text3'),
      ]);
    }

    const url = new URL(
      this.configService.getOrThrow('app.frontendDomain', {
        infer: true,
      }) + '/confirm-email',
    );
    url.searchParams.set('hash', mailData.data.hash);

    await this.mailerService.sendMail({
      to: mailData.to,
      subject: emailConfirmTitle,
      text: `${url.toString()} ${emailConfirmTitle}`,
      templatePath: path.join(
        this.configService.getOrThrow('app.workingDirectory', {
          infer: true,
        }),
        'src',
        'mail',
        'mail-templates',
        'activation.hbs',
      ),
      context: {
        title: emailConfirmTitle,
        url: url.toString(),
        actionTitle: emailConfirmTitle,
        app_name: this.configService.get('app.name', { infer: true }),
        text1,
        text2,
        text3,
      },
    });
  }

  async forgotPassword(
    mailData: MailData<{ hash: string; tokenExpires: number }>,
  ): Promise<void> {
    const i18n = I18nContext.current();
    let resetPasswordTitle: MaybeType<string>;
    let text1: MaybeType<string>;
    let text2: MaybeType<string>;
    let text3: MaybeType<string>;
    let text4: MaybeType<string>;

    if (i18n) {
      [resetPasswordTitle, text1, text2, text3, text4] = await Promise.all([
        i18n.t('common.resetPassword'),
        i18n.t('reset-password.text1'),
        i18n.t('reset-password.text2'),
        i18n.t('reset-password.text3'),
        i18n.t('reset-password.text4'),
      ]);
    }

    const url = new URL(
      this.configService.getOrThrow('app.frontendDomain', {
        infer: true,
      }) + '/password-change',
    );
    url.searchParams.set('hash', mailData.data.hash);
    url.searchParams.set('expires', mailData.data.tokenExpires.toString());

    await this.mailerService.sendMail({
      to: mailData.to,
      subject: resetPasswordTitle,
      text: `${url.toString()} ${resetPasswordTitle}`,
      templatePath: path.join(
        this.configService.getOrThrow('app.workingDirectory', {
          infer: true,
        }),
        'src',
        'mail',
        'mail-templates',
        'reset-password.hbs',
      ),
      context: {
        title: resetPasswordTitle,
        url: url.toString(),
        actionTitle: resetPasswordTitle,
        app_name: this.configService.get('app.name', {
          infer: true,
        }),
        text1,
        text2,
        text3,
        text4,
      },
    });
  }

  async giftCardPurchase(
    mailData: MailData<{
      code: string;
      amount: number;
      currencySymbol: string;
      currencyCode: string;
      purchaserName: string;
      recipientName?: string;
      notes?: string;
      expirationDate?: Date;
      templateImage?: string;
      codePosition?: {
        x: number;
        y: number;
        width: number;
        height: number;
        fontSize?: number;
        fontColor?: string;
        alignment?: string;
      };
      qrPosition?: { x: number; y: number; size: number };
    }>,
    bcc?: string[],
    isRecipient = false,
  ): Promise<void> {
    const url = new URL(
      this.configService.getOrThrow('app.frontendDomain', {
        infer: true,
      }) + '/gift-cards/balance',
    );

    const viewUrl = new URL(
      this.configService.getOrThrow('app.frontendDomain', {
        infer: true,
      }) + `/gift-cards/view/${mailData.data.code}`,
    );

    const { templateImage, codePosition } = mailData.data;
    const hasTemplate = !!(templateImage && codePosition);

    const attachments: Array<{
      filename: string;
      content: Buffer | string;
      contentType?: string;
      cid?: string;
    }> = [];

    let hasInlineImage = false;

    // Compute expiration label
    let expirationLabel = 'EXP: Never';
    if (mailData.data.expirationDate) {
      const d = new Date(mailData.data.expirationDate);
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const yyyy = d.getFullYear();
      expirationLabel =
        mailData.data.currencyCode === 'USD'
          ? `EXP: ${mm}/${dd}/${yyyy}`
          : `EXP: ${dd}/${mm}/${yyyy}`;
    }

    if (hasTemplate) {
      const qrUrl =
        this.configService.getOrThrow('app.frontendDomain', {
          infer: true,
        }) + `/gift-cards/qr/${mailData.data.code}`;

      const renderOpts = {
        templateImage: templateImage!,
        code: mailData.data.code,
        amount: mailData.data.amount.toFixed(2),
        currencySymbol: mailData.data.currencySymbol,
        codePosition: codePosition!,
        recipientName: mailData.data.recipientName,
        notes: mailData.data.notes,
        expirationLabel,
        qrUrl,
        qrPosition: mailData.data.qrPosition,
      };

      try {
        // Generate inline image for email
        const imageBuffer = await generateGiftCardImage(renderOpts);
        attachments.push({
          filename: 'gift-card.png',
          content: imageBuffer,
          cid: 'giftcardimage',
        });
        hasInlineImage = true;

        // Generate PDF attachment
        const pdfBuffer = await generateGiftCardPdf(renderOpts);
        attachments.push({
          filename: `gift-card-${mailData.data.code}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        });
      } catch {
        // If PDF generation fails, still send the email without attachments
      }
    }

    await this.mailerService.sendMail({
      to: mailData.to,
      bcc: bcc?.length ? bcc : undefined,
      attachments,
      subject: isRecipient
        ? `You Received a Gift Card from ${mailData.data.purchaserName}`
        : `Your Gift Card from ${this.configService.get('app.name', { infer: true })}`,
      text: `Your gift card code is ${mailData.data.code} for ${mailData.data.currencySymbol}${mailData.data.amount}`,
      templatePath: path.join(
        this.configService.getOrThrow('app.workingDirectory', {
          infer: true,
        }),
        'src',
        'mail',
        'mail-templates',
        isRecipient ? 'gift-card-recipient.hbs' : 'gift-card-purchase.hbs',
      ),
      context: {
        app_name: this.configService.get('app.name', { infer: true }),
        purchaserName: mailData.data.purchaserName,
        code: mailData.data.code,
        amount: mailData.data.amount.toFixed(2),
        currencySymbol: mailData.data.currencySymbol,
        expirationLabel,
        recipientName: mailData.data.recipientName,
        notes: mailData.data.notes,
        balanceUrl: url.toString(),
        viewUrl: viewUrl.toString(),
        hasInlineImage,
      },
    });
  }

  async giftCardPurchaseNotification(mailData: {
    to: string[];
    code: string;
    amount: number;
    currencySymbol: string;
    purchaserName: string;
    purchaserEmail: string;
    recipientName?: string;
  }): Promise<void> {
    if (!mailData.to.length) return;

    const appName = this.configService.get('app.name', { infer: true });

    await this.mailerService.sendMail({
      to: mailData.to,
      subject: `New Gift Card Purchase - ${mailData.currencySymbol}${mailData.amount.toFixed(2)}`,
      text: `New gift card purchased: ${mailData.code} for ${mailData.currencySymbol}${mailData.amount.toFixed(2)} by ${mailData.purchaserName} (${mailData.purchaserEmail})`,
      templatePath: path.join(
        this.configService.getOrThrow('app.workingDirectory', {
          infer: true,
        }),
        'src',
        'mail',
        'mail-templates',
        'gift-card-purchase-notification.hbs',
      ),
      context: {
        app_name: appName,
        code: mailData.code,
        amount: mailData.amount.toFixed(2),
        currencySymbol: mailData.currencySymbol,
        purchaserName: mailData.purchaserName,
        purchaserEmail: mailData.purchaserEmail,
        recipientName: mailData.recipientName,
      },
    });
  }

  async confirmNewEmail(mailData: MailData<{ hash: string }>): Promise<void> {
    const i18n = I18nContext.current();
    let emailConfirmTitle: MaybeType<string>;
    let text1: MaybeType<string>;
    let text2: MaybeType<string>;
    let text3: MaybeType<string>;

    if (i18n) {
      [emailConfirmTitle, text1, text2, text3] = await Promise.all([
        i18n.t('common.confirmEmail'),
        i18n.t('confirm-new-email.text1'),
        i18n.t('confirm-new-email.text2'),
        i18n.t('confirm-new-email.text3'),
      ]);
    }

    const url = new URL(
      this.configService.getOrThrow('app.frontendDomain', {
        infer: true,
      }) + '/confirm-new-email',
    );
    url.searchParams.set('hash', mailData.data.hash);

    await this.mailerService.sendMail({
      to: mailData.to,
      subject: emailConfirmTitle,
      text: `${url.toString()} ${emailConfirmTitle}`,
      templatePath: path.join(
        this.configService.getOrThrow('app.workingDirectory', {
          infer: true,
        }),
        'src',
        'mail',
        'mail-templates',
        'confirm-new-email.hbs',
      ),
      context: {
        title: emailConfirmTitle,
        url: url.toString(),
        actionTitle: emailConfirmTitle,
        app_name: this.configService.get('app.name', { infer: true }),
        text1,
        text2,
        text3,
      },
    });
  }
}
