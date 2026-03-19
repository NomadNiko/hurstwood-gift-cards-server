import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { randomUUID } from 'crypto';
import { SettingsRepository } from './infrastructure/persistence/document/repositories/settings.repository';
import { Settings, SquarespacePayLink } from './domain/settings';
import { UpdateSettingsDto } from './dto/update-settings.dto';

export const CURRENCY_SYMBOLS: Record<string, string> = {
  GBP: '£',
  EUR: '€',
  USD: '$',
};

@Injectable()
export class SettingsService {
  constructor(
    private readonly repository: SettingsRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  get(): Promise<Settings> {
    return this.repository.get();
  }

  async update(dto: UpdateSettingsDto): Promise<Settings> {
    const { squarespacePayLinks: dtoPayLinks, ...rest } = dto;
    const data: Partial<Settings> = { ...rest };
    if (dtoPayLinks) {
      data.squarespacePayLinks = dtoPayLinks.map((pl) => {
        const link = new SquarespacePayLink();
        link.id = pl.id || randomUUID();
        link.name = pl.name;
        link.productName = pl.productName;
        link.templateId = pl.templateId;
        return link;
      });
    }
    const result = await this.repository.update(data);
    this.eventEmitter.emit('settings.updated');
    return result;
  }

  async updateLastPollAt(date: Date): Promise<void> {
    await this.repository.update({ squarespaceLastPollAt: date } as any);
  }

  async getCurrencySymbol(): Promise<string> {
    const settings = await this.get();
    return CURRENCY_SYMBOLS[settings.currency] || '£';
  }
}
