import { Injectable, Logger } from '@nestjs/common';
import fs from 'node:fs/promises';
import { ConfigService } from '@nestjs/config';
import nodemailer from 'nodemailer';
import Handlebars from 'handlebars';
import { AllConfigType } from '../config/config.type';

function toEmailArray(
  value: string | string[] | undefined,
): string[] | undefined {
  if (!value) return undefined;
  if (Array.isArray(value)) return value;
  return value
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);
}

function attachmentContentToBase64(content: unknown): string {
  if (Buffer.isBuffer(content)) return content.toString('base64');
  if (typeof content === 'string') {
    // Assume raw string content (e.g. from a template) rather than base64.
    return Buffer.from(content).toString('base64');
  }
  return '';
}

@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);
  private readonly transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService<AllConfigType>) {
    this.transporter = nodemailer.createTransport({
      host: configService.get('mail.host', { infer: true }),
      port: configService.get('mail.port', { infer: true }),
      ignoreTLS: configService.get('mail.ignoreTLS', { infer: true }),
      secure: configService.get('mail.secure', { infer: true }),
      requireTLS: configService.get('mail.requireTLS', { infer: true }),
      auth: {
        user: configService.get('mail.user', { infer: true }),
        pass: configService.get('mail.password', { infer: true }),
      },
    });
  }

  async sendMail({
    templatePath,
    context,
    ...mailOptions
  }: nodemailer.SendMailOptions & {
    templatePath: string;
    context: Record<string, unknown>;
  }): Promise<void> {
    let html: string | undefined;
    if (templatePath) {
      const template = await fs.readFile(templatePath, 'utf-8');
      html = Handlebars.compile(template, {
        strict: true,
      })(context);
    }

    const from = mailOptions.from
      ? mailOptions.from
      : `"${this.configService.get('mail.defaultName', {
          infer: true,
        })}" <${this.configService.get('mail.defaultEmail', {
          infer: true,
        })}>`;

    const resolvedHtml = mailOptions.html ? mailOptions.html : html;

    const resendApiKey = this.configService.get('mail.resendApiKey', {
      infer: true,
    });
    const provider = this.configService.get('mail.provider', {
      infer: true,
    });

    if (provider === 'resend' && resendApiKey) {
      await this.sendMailViaResendApi(resendApiKey, {
        ...mailOptions,
        from,
        html: resolvedHtml,
      });
      return;
    }

    await this.transporter.sendMail({
      ...mailOptions,
      from,
      html: resolvedHtml,
    });
  }

  private async sendMailViaResendApi(
    apiKey: string,
    mailOptions: nodemailer.SendMailOptions,
  ): Promise<void> {
    const attachments = Array.isArray(mailOptions.attachments)
      ? mailOptions.attachments.map((attachment) => ({
          filename: attachment.filename as string,
          content: attachmentContentToBase64(attachment.content),
          content_type: attachment.contentType,
          content_id: attachment.cid,
        }))
      : undefined;

    const body: Record<string, unknown> = {
      from: mailOptions.from,
      to: toEmailArray(mailOptions.to as string | string[]),
      cc: toEmailArray(mailOptions.cc as string | string[]),
      bcc: toEmailArray(mailOptions.bcc as string | string[]),
      subject: mailOptions.subject,
      html: mailOptions.html,
      text: mailOptions.text,
      attachments,
    };

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '');
      this.logger.error(`Resend API error (${response.status}): ${errorBody}`);
      throw new Error(
        `Resend API responded with ${response.status}: ${errorBody}`,
      );
    }
  }
}
