import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { NullableType } from '../../../../../utils/types/nullable.type';
import { IPaginationOptions } from '../../../../../utils/types/pagination-options';
import { GiftCard } from '../../../../domain/gift-card';
import { GiftCardRepository } from '../../gift-card.repository';
import { GiftCardSchemaClass } from '../entities/gift-card.schema';
import { GiftCardMapper } from '../mappers/gift-card.mapper';
import { SortGiftCardDto } from '../../../../dto/query-gift-card.dto';

@Injectable()
export class GiftCardsDocumentRepository implements GiftCardRepository {
  constructor(
    @InjectModel(GiftCardSchemaClass.name)
    private readonly model: Model<GiftCardSchemaClass>,
  ) {}

  async create(data: GiftCard): Promise<GiftCard> {
    const persistence = GiftCardMapper.toPersistence(data);
    const created = new this.model(persistence);
    const saved = await created.save();
    return GiftCardMapper.toDomain(saved);
  }

  async findManyWithPagination({
    filterOptions,
    sortOptions,
    paginationOptions,
  }: {
    filterOptions?: { status?: string; templateId?: string } | null;
    sortOptions?: SortGiftCardDto[] | null;
    paginationOptions: IPaginationOptions;
  }): Promise<GiftCard[]> {
    const where: FilterQuery<GiftCardSchemaClass> = {};
    if (filterOptions?.status) where.status = filterOptions.status;
    if (filterOptions?.templateId) where.templateId = filterOptions.templateId;

    const results = await this.model
      .find(where)
      .sort(
        sortOptions?.reduce(
          (acc, sort) => ({
            ...acc,
            [sort.orderBy === 'id' ? '_id' : sort.orderBy]:
              sort.order.toUpperCase() === 'ASC' ? 1 : -1,
          }),
          {},
        ) || { purchaseDate: -1 },
      )
      .skip((paginationOptions.page - 1) * paginationOptions.limit)
      .limit(paginationOptions.limit);

    return results.map(GiftCardMapper.toDomain);
  }

  async findById(id: GiftCard['id']): Promise<NullableType<GiftCard>> {
    const result = await this.model.findById(id);
    return result ? GiftCardMapper.toDomain(result) : null;
  }

  async findByCode(code: string): Promise<NullableType<GiftCard>> {
    const result = await this.model.findOne({ code });
    return result ? GiftCardMapper.toDomain(result) : null;
  }

  async findByEmail(email: string): Promise<GiftCard[]> {
    const results = await this.model
      .find({
        $or: [{ purchaserEmail: email }, { recipientEmail: email }],
      })
      .sort({ purchaseDate: -1 });
    return results.map(GiftCardMapper.toDomain);
  }

  async findByStripeSessionId(
    sessionId: string,
  ): Promise<NullableType<GiftCard>> {
    const result = await this.model.findOne({ stripeSessionId: sessionId });
    return result ? GiftCardMapper.toDomain(result) : null;
  }

  async findBySquarespaceOrderId(
    orderId: string,
  ): Promise<NullableType<GiftCard>> {
    const result = await this.model.findOne({ squarespaceOrderId: orderId });
    return result ? GiftCardMapper.toDomain(result) : null;
  }

  async update(
    id: GiftCard['id'],
    payload: Partial<GiftCard>,
  ): Promise<GiftCard | null> {
    const existing = await this.model.findById(id);
    if (!existing) return null;

    const merged = { ...GiftCardMapper.toDomain(existing), ...payload };
    const result = await this.model.findByIdAndUpdate(
      id,
      GiftCardMapper.toPersistence(merged),
      { new: true },
    );
    return result ? GiftCardMapper.toDomain(result) : null;
  }

  async isCodeUnique(code: string): Promise<boolean> {
    const count = await this.model.countDocuments({ code });
    return count === 0;
  }
}
