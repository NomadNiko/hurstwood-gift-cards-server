import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  HttpStatus,
  HttpCode,
  Request,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../roles/roles.guard';
import { Roles } from '../roles/roles.decorator';
import { RoleEnum } from '../roles/roles.enum';
import { GiftCardTemplatesService } from './gift-card-templates.service';
import { CreateGiftCardTemplateDto } from './dto/create-gift-card-template.dto';
import { UpdateGiftCardTemplateDto } from './dto/update-gift-card-template.dto';
import { QueryGiftCardTemplateDto } from './dto/query-gift-card-template.dto';
import { GiftCardTemplate } from './domain/gift-card-template';
import {
  InfinityPaginationResponse,
  InfinityPaginationResponseDto,
} from '../utils/dto/infinity-pagination-response.dto';
import { infinityPagination } from '../utils/infinity-pagination';

@ApiTags('Gift Card Templates')
@Controller({
  path: 'gift-card-templates',
  version: '1',
})
export class GiftCardTemplatesController {
  constructor(private readonly service: GiftCardTemplatesService) {}

  @Post()
  @ApiBearerAuth()
  @Roles(RoleEnum.admin)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() dto: CreateGiftCardTemplateDto,
    @Request() req,
  ): Promise<GiftCardTemplate> {
    return this.service.create(dto, req.user.id);
  }

  @Get()
  @ApiBearerAuth()
  @Roles(RoleEnum.admin)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @ApiOkResponse({ type: InfinityPaginationResponse(GiftCardTemplate) })
  @HttpCode(HttpStatus.OK)
  async findAll(
    @Query() query: QueryGiftCardTemplateDto,
  ): Promise<InfinityPaginationResponseDto<GiftCardTemplate>> {
    const page = query?.page ?? 1;
    const limit = Math.min(query?.limit ?? 10, 50);
    return infinityPagination(
      await this.service.findManyWithPagination({
        sortOptions: query?.sort,
        paginationOptions: { page, limit },
      }),
      { page, limit },
    );
  }

  @Get('active')
  @HttpCode(HttpStatus.OK)
  findActive(): Promise<GiftCardTemplate[]> {
    return this.service.findActive();
  }

  @Get('public/:id')
  @HttpCode(HttpStatus.OK)
  findOnePublic(@Param('id') id: string): Promise<GiftCardTemplate | null> {
    return this.service.findById(id);
  }

  @Get(':id')
  @ApiBearerAuth()
  @Roles(RoleEnum.admin)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @HttpCode(HttpStatus.OK)
  findOne(@Param('id') id: string): Promise<GiftCardTemplate | null> {
    return this.service.findById(id);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @Roles(RoleEnum.admin)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @HttpCode(HttpStatus.OK)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateGiftCardTemplateDto,
  ): Promise<GiftCardTemplate | null> {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @Roles(RoleEnum.admin)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string): Promise<void> {
    return this.service.softDelete(id);
  }
}
