import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  Query,
  HttpStatus,
  HttpCode,
  Request,
  Headers,
  RawBodyRequest,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../roles/roles.guard';
import { Roles } from '../roles/roles.decorator';
import { RoleEnum } from '../roles/roles.enum';
import { GiftCardsService } from './gift-cards.service';
import { CreateGiftCardDto } from './dto/create-gift-card.dto';
import { RedeemGiftCardDto } from './dto/redeem-gift-card.dto';
import { UnredeemGiftCardDto } from './dto/unredeem-gift-card.dto';
import { QueryGiftCardDto } from './dto/query-gift-card.dto';
import { GiftCard } from './domain/gift-card';
import {
  InfinityPaginationResponse,
  InfinityPaginationResponseDto,
} from '../utils/dto/infinity-pagination-response.dto';
import { infinityPagination } from '../utils/infinity-pagination';
import { StripeService } from '../stripe/stripe.service';
import { SettingsService } from '../settings/settings.service';
import { GiftCardTemplatesService } from '../gift-card-templates/gift-card-templates.service';

@ApiTags('Gift Cards')
@Controller({
  path: 'gift-cards',
  version: '1',
})
export class GiftCardsController {
  constructor(
    private readonly service: GiftCardsService,
    private readonly stripeService: StripeService,
    private readonly settingsService: SettingsService,
    private readonly templatesService: GiftCardTemplatesService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  purchase(@Body() dto: CreateGiftCardDto): Promise<GiftCard> {
    return this.service.purchase(dto);
  }

  @Post('create-checkout-session')
  @HttpCode(HttpStatus.OK)
  async createCheckoutSession(
    @Body() dto: CreateGiftCardDto & { successUrl: string; cancelUrl: string },
  ) {
    const settings = await this.settingsService.get();
    const template = await this.templatesService.findById(dto.templateId);
    const adminFee =
      template?.adminFeeType === 'fixed'
        ? template.adminFeeValue || 0
        : template?.adminFeeType === 'percentage'
          ? Math.round(dto.originalAmount * (template.adminFeeValue || 0)) / 100
          : 0;
    const session = await this.stripeService.createCheckoutSession({
      amount: dto.originalAmount,
      adminFee,
      currency: settings.currency,
      metadata: {
        templateId: dto.templateId,
        widgetId: dto.widgetId || '',
        originalAmount: String(dto.originalAmount),
        purchaserEmail: dto.purchaserEmail,
        purchaserName: dto.purchaserName,
        recipientEmail: dto.recipientEmail || '',
        recipientName: dto.recipientName || '',
        notes: dto.notes || '',
      },
      successUrl: dto.successUrl,
      cancelUrl: dto.cancelUrl,
    });

    return session;
  }

  @Post('notify-purchase')
  @HttpCode(HttpStatus.OK)
  async notifyPurchase(@Body() dto: { stripeSessionId: string }) {
    const meta = await this.stripeService.retrieveSessionMetadata(
      dto.stripeSessionId,
    );
    await this.service.sendStaffNotification({
      amount: parseFloat(meta.originalAmount),
      purchaserName: meta.purchaserName,
      purchaserEmail: meta.purchaserEmail,
      recipientName: meta.recipientName || undefined,
    });
    return { sent: true };
  }

  @Post('stripe-webhook')
  @HttpCode(HttpStatus.OK)
  async stripeWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    if (!req.rawBody) {
      throw new BadRequestException('Missing raw body');
    }
    const event = await this.stripeService.constructWebhookEvent(
      req.rawBody,
      signature,
    );
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as any;
      const meta = session.metadata;
      if (meta?.templateId) {
        await this.service.purchase(
          {
            templateId: meta.templateId,
            widgetId: meta.widgetId || undefined,
            originalAmount: parseFloat(meta.originalAmount),
            purchaserEmail: meta.purchaserEmail,
            purchaserName: meta.purchaserName,
            recipientEmail: meta.recipientEmail || undefined,
            recipientName: meta.recipientName || undefined,
            notes: meta.notes || undefined,
          },
          session.id,
        );
      }
    }
    return { received: true };
  }

  @Get('stripe-session/:sessionId')
  @HttpCode(HttpStatus.OK)
  findByStripeSession(
    @Param('sessionId') sessionId: string,
  ): Promise<GiftCard | null> {
    return this.service.findByStripeSessionId(sessionId);
  }

  @Get()
  @ApiBearerAuth()
  @Roles(RoleEnum.admin, RoleEnum.staff)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @ApiOkResponse({ type: InfinityPaginationResponse(GiftCard) })
  @HttpCode(HttpStatus.OK)
  async findAll(
    @Query() query: QueryGiftCardDto,
  ): Promise<InfinityPaginationResponseDto<GiftCard>> {
    const page = query?.page ?? 1;
    const limit = Math.min(query?.limit ?? 10, 50);
    return infinityPagination(
      await this.service.findManyWithPagination({
        filterOptions: {
          status: query?.status,
          templateId: query?.templateId,
          isArchived: query?.isArchived,
        },
        sortOptions: query?.sort,
        paginationOptions: { page, limit },
      }),
      { page, limit },
    );
  }

  @Get(':id')
  @ApiBearerAuth()
  @Roles(RoleEnum.admin, RoleEnum.staff)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @HttpCode(HttpStatus.OK)
  findOne(@Param('id') id: string): Promise<GiftCard | null> {
    return this.service.findById(id);
  }

  @Get('code/:code')
  @HttpCode(HttpStatus.OK)
  findByCode(@Param('code') code: string): Promise<GiftCard | null> {
    return this.service.findByCode(code);
  }

  @Get('email/:email')
  @HttpCode(HttpStatus.OK)
  findByEmail(@Param('email') email: string): Promise<GiftCard[]> {
    return this.service.findByEmail(email);
  }

  @Post(':id/redeem')
  @ApiBearerAuth()
  @Roles(RoleEnum.admin, RoleEnum.staff)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @HttpCode(HttpStatus.OK)
  redeem(
    @Param('id') id: string,
    @Body() dto: RedeemGiftCardDto,
    @Request() req,
  ): Promise<GiftCard> {
    return this.service.redeem(id, dto, req.user.id);
  }

  @Patch(':id/cancel')
  @ApiBearerAuth()
  @Roles(RoleEnum.admin, RoleEnum.staff)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @HttpCode(HttpStatus.OK)
  cancel(@Param('id') id: string): Promise<GiftCard | null> {
    return this.service.cancel(id);
  }

  @Post(':id/resend-email')
  @ApiBearerAuth()
  @Roles(RoleEnum.admin, RoleEnum.staff)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @HttpCode(HttpStatus.OK)
  async resendEmail(@Param('id') id: string) {
    await this.service.resendEmail(id);
    return { sent: true };
  }

  @Patch(':id/archive')
  @ApiBearerAuth()
  @Roles(RoleEnum.admin)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @HttpCode(HttpStatus.OK)
  archive(@Param('id') id: string): Promise<GiftCard | null> {
    return this.service.archive(id);
  }

  @Patch(':id/unarchive')
  @ApiBearerAuth()
  @Roles(RoleEnum.admin)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @HttpCode(HttpStatus.OK)
  unarchive(@Param('id') id: string): Promise<GiftCard | null> {
    return this.service.unarchive(id);
  }

  @Post(':id/unredeem')
  @ApiBearerAuth()
  @Roles(RoleEnum.admin)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @HttpCode(HttpStatus.OK)
  unredeem(
    @Param('id') id: string,
    @Body() dto: UnredeemGiftCardDto,
    @Request() req,
  ): Promise<GiftCard> {
    return this.service.unredeem(id, dto.redemptionId, req.user.id);
  }
}
