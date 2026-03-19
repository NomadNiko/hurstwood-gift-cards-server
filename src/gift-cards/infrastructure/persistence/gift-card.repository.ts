import { NullableType } from '../../../utils/types/nullable.type';
import { IPaginationOptions } from '../../../utils/types/pagination-options';
import { GiftCard } from '../../domain/gift-card';
import { SortGiftCardDto } from '../../dto/query-gift-card.dto';

export abstract class GiftCardRepository {
  abstract create(
    data: Omit<GiftCard, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<GiftCard>;

  abstract findManyWithPagination(params: {
    filterOptions?: { status?: string; templateId?: string } | null;
    sortOptions?: SortGiftCardDto[] | null;
    paginationOptions: IPaginationOptions;
  }): Promise<GiftCard[]>;

  abstract findById(id: GiftCard['id']): Promise<NullableType<GiftCard>>;

  abstract findByCode(code: string): Promise<NullableType<GiftCard>>;

  abstract findByEmail(email: string): Promise<GiftCard[]>;

  abstract findByStripeSessionId(
    sessionId: string,
  ): Promise<NullableType<GiftCard>>;

  abstract findBySquarespaceOrderId(
    orderId: string,
  ): Promise<NullableType<GiftCard>>;

  abstract update(
    id: GiftCard['id'],
    payload: Partial<GiftCard>,
  ): Promise<GiftCard | null>;

  abstract isCodeUnique(code: string): Promise<boolean>;
}
