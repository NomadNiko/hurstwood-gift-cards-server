import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { I18nContext } from 'nestjs-i18n';
import { MailData } from './interfaces/mail-data.interface';

import { MaybeType } from '../utils/types/maybe.type';
import { MailerService } from '../mailer/mailer.service';
import path from 'path';
import { AllConfigType } from '../config/config.type';

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
      purchaserName: string;
      recipientName?: string;
      notes?: string;
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
    }>,
    bcc?: string[],
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

    // Build printable HTML attachment
    const attachments: Array<{
      filename: string;
      content: string;
      contentType: string;
    }> = [];
    if (hasTemplate) {
      const cp = codePosition!;
      const printableHtml = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Gift Card - ${mailData.data.code}</title><style>@media print{body{margin:0}}</style></head><body style="margin:0;font-family:arial;text-align:center;background:#f5f5f5"><div style="max-width:600px;margin:20px auto;background:#fff;padding:20px;border-radius:8px"><div style="position:relative;display:inline-block;width:100%"><img src="${templateImage}" style="width:100%;display:block" /><div style="position:absolute;left:${cp.x}%;top:${cp.y}%;width:${cp.width}%;height:${cp.height}%;display:flex;align-items:center;justify-content:${cp.alignment || 'center'};overflow:hidden"><span style="font-size:${cp.fontSize || 16}px;color:${cp.fontColor || '#000'};font-weight:bold;white-space:nowrap">${mailData.data.code}</span></div></div><h2 style="font-family:monospace;margin:16px 0 8px">${mailData.data.code}</h2><h3 style="color:#00838f;margin:0">${mailData.data.currencySymbol}${mailData.data.amount.toFixed(2)}</h3>${mailData.data.recipientName ? `<p>For: ${mailData.data.recipientName}</p>` : ''}${mailData.data.notes ? `<p style="font-style:italic;color:#555">&ldquo;${mailData.data.notes}&rdquo;</p>` : ''}</div></body></html>`;
      attachments.push({
        filename: `gift-card-${mailData.data.code}.html`,
        content: printableHtml,
        contentType: 'text/html',
      });
    }

    await this.mailerService.sendMail({
      to: mailData.to,
      bcc: bcc?.length ? bcc : undefined,
      attachments,
      subject: `Your Gift Card from ${this.configService.get('app.name', { infer: true })}`,
      text: `Your gift card code is ${mailData.data.code} for ${mailData.data.currencySymbol}${mailData.data.amount}`,
      templatePath: path.join(
        this.configService.getOrThrow('app.workingDirectory', {
          infer: true,
        }),
        'src',
        'mail',
        'mail-templates',
        'gift-card-purchase.hbs',
      ),
      context: {
        app_name: this.configService.get('app.name', { infer: true }),
        purchaserName: mailData.data.purchaserName,
        code: mailData.data.code,
        amount: mailData.data.amount.toFixed(2),
        currencySymbol: mailData.data.currencySymbol,
        recipientName: mailData.data.recipientName,
        notes: mailData.data.notes,
        balanceUrl: url.toString(),
        viewUrl: viewUrl.toString(),
        hasTemplate,
        templateImage,
        cpX: codePosition?.x,
        cpY: codePosition?.y,
        cpWidth: codePosition?.width,
        cpHeight: codePosition?.height,
        cpFontSize: codePosition?.fontSize || 16,
        cpFontColor: codePosition?.fontColor || '#000',
        cpAlignment: codePosition?.alignment || 'center',
      },
    });
  }

  async giftCardPurchaseNotification(
    mailData: {
      to: string[];
      code: string;
      amount: number;
      currencySymbol: string;
      purchaserName: string;
      purchaserEmail: string;
      recipientName?: string;
    },
  ): Promise<void> {
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
