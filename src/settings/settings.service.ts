import { Injectable } from '@nestjs/common';
import { SettingsRepository } from './infrastructure/persistence/document/repositories/settings.repository';
import { Settings } from './domain/settings';
import { UpdateSettingsDto } from './dto/update-settings.dto';

export const CURRENCY_SYMBOLS: Record<string, string> = {
  GBP: '£',
  EUR: '€',
  USD: '$',
};

@Injectable()
export class SettingsService {
  constructor(private readonly repository: SettingsRepository) {}

  get(): Promise<Settings> {
    return this.repository.get();
  }

  update(dto: UpdateSettingsDto): Promise<Settings> {
    return this.repository.update(dto);
  }

  async getCurrencySymbol(): Promise<string> {
    const settings = await this.get();
    return CURRENCY_SYMBOLS[settings.currency] || '£';
  }
}
