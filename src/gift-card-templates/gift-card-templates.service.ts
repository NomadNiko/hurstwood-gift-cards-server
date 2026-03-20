import { Injectable } from '@nestjs/common';
import { GiftCardTemplateRepository } from './infrastructure/persistence/gift-card-template.repository';
import { GiftCardTemplate } from './domain/gift-card-template';
import { CreateGiftCardTemplateDto } from './dto/create-gift-card-template.dto';
import { UpdateGiftCardTemplateDto } from './dto/update-gift-card-template.dto';
import { IPaginationOptions } from '../utils/types/pagination-options';
import { NullableType } from '../utils/types/nullable.type';
import { SortGiftCardTemplateDto } from './dto/query-gift-card-template.dto';

@Injectable()
export class GiftCardTemplatesService {
  constructor(private readonly repository: GiftCardTemplateRepository) {}

  create(
    dto: CreateGiftCardTemplateDto,
    userId: string,
  ): Promise<GiftCardTemplate> {
    return this.repository.create({
      name: dto.name,
      description: dto.description || '',
      image: dto.image,
      codePosition: dto.codePosition,
      redemptionType: dto.redemptionType || 'full',
      expirationDate: dto.expirationDate
        ? new Date(dto.expirationDate)
        : undefined,
      expirationMonths: dto.expirationMonths || undefined,
      codePrefix: dto.codePrefix || 'GC',
      qrPosition: dto.qrPosition,
      isActive: dto.isActive ?? true,
      createdBy: userId,
    });
  }

  findManyWithPagination({
    sortOptions,
    paginationOptions,
  }: {
    sortOptions?: SortGiftCardTemplateDto[] | null;
    paginationOptions: IPaginationOptions;
  }): Promise<GiftCardTemplate[]> {
    return this.repository.findManyWithPagination({
      sortOptions,
      paginationOptions,
    });
  }

  findById(id: string): Promise<NullableType<GiftCardTemplate>> {
    return this.repository.findById(id);
  }

  findActive(): Promise<GiftCardTemplate[]> {
    return this.repository.findActive();
  }

  update(
    id: string,
    dto: UpdateGiftCardTemplateDto,
  ): Promise<GiftCardTemplate | null> {
    const payload: Record<string, any> = { ...dto };
    if (dto.expirationDate) {
      payload.expirationDate = new Date(dto.expirationDate);
    } else if ('expirationDate' in dto) {
      payload.expirationDate = null;
    }
    if ('expirationMonths' in dto && !dto.expirationMonths) {
      payload.expirationMonths = null;
    }
    return this.repository.update(id, payload);
  }

  softDelete(id: string): Promise<void> {
    return this.repository.softDelete(id);
  }
}
