import { Injectable } from '@nestjs/common';
import { SettingsService } from '../settings/settings.service';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  constructor(private readonly settingsService: SettingsService) {}

  private async getClient(): Promise<Stripe> {
    const settings = await this.settingsService.get();
    if (!settings.stripeSecretKey) {
      throw new Error('Stripe secret key not configured');
    }
    return new Stripe(settings.stripeSecretKey);
  }

  async createCheckoutSession(params: {
    amount: number;
    adminFee?: number;
    currency: string;
    metadata: Record<string, string>;
    successUrl: string;
    cancelUrl: string;
  }): Promise<{ sessionId: string; url: string }> {
    const stripe = await this.getClient();
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
      {
        price_data: {
          currency: params.currency.toLowerCase(),
          product_data: { name: 'Gift Voucher' },
          unit_amount: Math.round(params.amount * 100),
        },
        quantity: 1,
      },
    ];
    if (params.adminFee && params.adminFee > 0) {
      lineItems.push({
        price_data: {
          currency: params.currency.toLowerCase(),
          product_data: { name: 'Processing Fee' },
          unit_amount: Math.round(params.adminFee * 100),
        },
        quantity: 1,
      });
    }
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      metadata: params.metadata,
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
    });
    return { sessionId: session.id, url: session.url! };
  }

  async constructWebhookEvent(
    payload: Buffer,
    signature: string,
  ): Promise<Stripe.Event> {
    const settings = await this.settingsService.get();
    const stripe = await this.getClient();
    return stripe.webhooks.constructEvent(
      payload,
      signature,
      settings.stripeWebhookSecret || '',
    );
  }
}
