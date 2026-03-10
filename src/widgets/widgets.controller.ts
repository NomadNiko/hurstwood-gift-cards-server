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
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../roles/roles.guard';
import { Roles } from '../roles/roles.decorator';
import { RoleEnum } from '../roles/roles.enum';
import { WidgetsService } from './widgets.service';
import { CreateWidgetDto } from './dto/create-widget.dto';
import { UpdateWidgetDto } from './dto/update-widget.dto';
import { Widget } from './domain/widget';
import {
  InfinityPaginationResponse,
  InfinityPaginationResponseDto,
} from '../utils/dto/infinity-pagination-response.dto';
import { infinityPagination } from '../utils/infinity-pagination';

@ApiTags('Widgets')
@Controller({
  path: 'widgets',
  version: '1',
})
export class WidgetsController {
  constructor(private readonly service: WidgetsService) {}

  @Post()
  @ApiBearerAuth()
  @Roles(RoleEnum.admin)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateWidgetDto, @Request() req): Promise<Widget> {
    return this.service.create(dto, req.user.id);
  }

  @Get()
  @ApiBearerAuth()
  @Roles(RoleEnum.admin)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @ApiOkResponse({ type: InfinityPaginationResponse(Widget) })
  @HttpCode(HttpStatus.OK)
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ): Promise<InfinityPaginationResponseDto<Widget>> {
    const p = page ?? 1;
    const l = Math.min(limit ?? 10, 50);
    return infinityPagination(
      await this.service.findManyWithPagination({
        paginationOptions: { page: p, limit: l },
      }),
      { page: p, limit: l },
    );
  }

  @Get('public/:apiKey')
  @HttpCode(HttpStatus.OK)
  findByApiKey(@Param('apiKey') apiKey: string): Promise<Widget | null> {
    return this.service.findByApiKey(apiKey);
  }

  @Get('loader/:apiKey/widget.js')
  @HttpCode(HttpStatus.OK)
  async getWidgetLoader(@Param('apiKey') apiKey: string, @Res() res: Response) {
    const { script, headers } = await this.service.generateWidgetLoader(apiKey);
    res.set(headers);
    res.send(script);
  }

  @Get(':id')
  @ApiBearerAuth()
  @Roles(RoleEnum.admin)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @HttpCode(HttpStatus.OK)
  findOne(@Param('id') id: string): Promise<Widget | null> {
    return this.service.findById(id);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @Roles(RoleEnum.admin)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @HttpCode(HttpStatus.OK)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateWidgetDto,
  ): Promise<Widget | null> {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @Roles(RoleEnum.admin)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string): Promise<void> {
    return this.service.remove(id);
  }
}
