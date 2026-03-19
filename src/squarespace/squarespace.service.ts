import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { SettingsService } from '../settings/settings.service';
import { GiftCardsService } from '../gift-cards/gift-cards.service';
import { SquarespacePayLink } from '../settings/domain/settings';

@Injectable()
export class SquarespaceService implements OnModuleInit {
  private readonly logger = new Logger(SquarespaceService.name);
  private readonly baseUrl = 'https://api.squarespace.com/1.0';
  private interval: ReturnType<typeof setInterval> | null = null;
  private polling = false;
  private apiKey = '';
  private payLinks: SquarespacePayLink[] = [];
  private lastCheck: Date = new Date();

  constructor(
    private readonly settingsService: SettingsService,
    private readonly giftCardsService: GiftCardsService,
  ) {}

  async onModuleInit() {
    await this.startPollingIfConfigured();
  }

  @OnEvent('settings.updated')
  async restartPolling() {
    this.stopPolling();
    await this.startPollingIfConfigured();
  }

  private stopPolling() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
      this.logger.log('Polling stopped');
    }
  }

  private async startPollingIfConfigured() {
    const settings = await this.settingsService.get();

    if (
      settings.paymentGateway !== 'squarespace' ||
      !settings.squarespaceApiKey ||
      !settings.squarespacePayLinks?.length
    ) {
      return;
    }

    this.apiKey = settings.squarespaceApiKey;
    this.payLinks = settings.squarespacePayLinks;
    this.lastCheck = settings.squarespaceLastPollAt || new Date();

    const intervalSec = settings.squarespacePollingInterval || 30;
    this.logger.log(
      `Starting polling (${intervalSec}s interval, ${this.payLinks.length} pay link(s))`,
    );

    this.interval = setInterval(() => this.poll(), intervalSec * 1000);
  }

  private async poll() {
    if (this.polling) return;
    this.polling = true;
    try {
      const now = new Date();
      const orders = await this.fetchOrders(
        this.lastCheck.toISOString(),
        now.toISOString(),
      );

      if (orders.length > 0) {
        this.logger.log(`Found ${orders.length} order(s) to process`);
      }

      for (const order of orders) {
        await this.processOrder(order);
      }

      this.lastCheck = now;
      await this.settingsService.updateLastPollAt(now).catch(() => {});
    } catch (err) {
      this.logger.error(`Poll failed: ${err}`);
    } finally {
      this.polling = false;
    }
  }

  private async processOrder(order: any) {
    for (const lineItem of order.lineItems || []) {
      const payLink = this.payLinks.find(
        (pl) => pl.productName === lineItem.productName,
      );
      if (!payLink) {
        this.logger.warn(
          `Order #${order.orderNumber}: no pay link match for product "${lineItem.productName}"`,
        );
        continue;
      }

      const compositeId = `${order.id}:${lineItem.id}`;

      // Deduplication
      const existing =
        await this.giftCardsService.findBySquarespaceOrderId(compositeId);
      if (existing) continue;

      const amount =
        parseFloat(lineItem.unitPricePaid?.value || '0') *
        (lineItem.quantity || 1);
      if (amount <= 0) continue;

      const purchaserName = order.billingAddress
        ? `${order.billingAddress.firstName || ''} ${order.billingAddress.lastName || ''}`.trim()
        : '';

      try {
        const giftCard = await this.giftCardsService.purchase(
          {
            templateId: payLink.templateId,
            originalAmount: amount,
            purchaserEmail: order.customerEmail || '',
            purchaserName: purchaserName || 'Squarespace Customer',
            recipientEmail: order.customerEmail || '',
            recipientName: purchaserName || 'Squarespace Customer',
          },
          undefined, // stripeSessionId
          compositeId, // squarespaceOrderId
        );
        this.logger.log(
          `Created gift card ${giftCard.code} (£${amount}) from order #${order.orderNumber}`,
        );
      } catch (err) {
        this.logger.error(
          `Failed to create gift card for order #${order.orderNumber} lineItem ${lineItem.id}: ${err}`,
        );
      }
    }
  }

  private async fetchOrders(after: string, before: string): Promise<any[]> {
    const allOrders: any[] = [];
    let cursor: string | null = null;

    do {
      let url = `${this.baseUrl}/commerce/orders?modifiedAfter=${after}&modifiedBefore=${before}`;
      if (cursor) url += `&cursor=${cursor}`;

      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'User-Agent': 'GiftCardServer',
        },
      });

      if (!res.ok) {
        throw new Error(`Squarespace API ${res.status}: ${await res.text()}`);
      }

      const data = await res.json();
      allOrders.push(...(data.result || []));
      cursor = data.pagination?.nextPageCursor || null;
    } while (cursor);

    return allOrders;
  }
}
