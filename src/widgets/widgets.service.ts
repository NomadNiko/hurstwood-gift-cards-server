import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WidgetRepository } from './infrastructure/persistence/widget.repository';
import { Widget } from './domain/widget';
import { CreateWidgetDto } from './dto/create-widget.dto';
import { UpdateWidgetDto } from './dto/update-widget.dto';
import { NullableType } from '../utils/types/nullable.type';
import { IPaginationOptions } from '../utils/types/pagination-options';
import { randomBytes } from 'crypto';
import { AllConfigType } from '../config/config.type';

@Injectable()
export class WidgetsService {
  constructor(
    private readonly repository: WidgetRepository,
    private readonly configService: ConfigService<AllConfigType>,
  ) {}

  create(dto: CreateWidgetDto, userId: string): Promise<Widget> {
    const apiKey = `wgt_${randomBytes(16).toString('hex')}`;
    return this.repository.create({
      name: dto.name,
      templateId: dto.templateId,
      apiKey,
      allowedDomains: dto.allowedDomains || [],
      customization: dto.customization,
      isActive: dto.isActive ?? true,
      createdBy: userId,
    });
  }

  findManyWithPagination(params: {
    paginationOptions: IPaginationOptions;
  }): Promise<Widget[]> {
    return this.repository.findManyWithPagination(params);
  }

  findById(id: string): Promise<NullableType<Widget>> {
    return this.repository.findById(id);
  }

  findByApiKey(apiKey: string): Promise<NullableType<Widget>> {
    return this.repository.findByApiKey(apiKey);
  }

  update(id: string, dto: UpdateWidgetDto): Promise<Widget | null> {
    return this.repository.update(id, dto);
  }

  remove(id: string): Promise<void> {
    return this.repository.remove(id);
  }

  async generateWidgetLoader(apiKey: string) {
    const widget = await this.repository.findByApiKey(apiKey);
    if (!widget) {
      return {
        script: '// Widget not found',
        headers: { 'Content-Type': 'application/javascript' },
      };
    }

    const frontendDomain = this.configService.getOrThrow('app.frontendDomain', {
      infer: true,
    });

    const script = `
(function() {
  'use strict';

  if (window.GiftCardWidgetLoaded_${apiKey.replace(/[^a-zA-Z0-9]/g, '_')}) return;
  window.GiftCardWidgetLoaded_${apiKey.replace(/[^a-zA-Z0-9]/g, '_')} = true;

  const CONFIG = {
    apiKey: "${apiKey}",
    appUrl: "${frontendDomain}"
  };

  function createWidget() {
    const container = document.getElementById('gift-card-widget-${apiKey}');
    if (!container) {
      console.error('Gift card widget container not found. Add <div id="gift-card-widget-${apiKey}"></div> to your page.');
      return;
    }

    const iframe = document.createElement('iframe');
    iframe.src = \`\${CONFIG.appUrl}/widget/\${CONFIG.apiKey}\`;
    iframe.style.cssText = 'width: 600px; height: 800px; border: none; display: block; overflow: hidden;';
    iframe.setAttribute('allow', 'clipboard-write');
    iframe.setAttribute('scrolling', 'no');
    iframe.setAttribute('title', 'Gift Card Purchase Widget');

    container.appendChild(iframe);

    window.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'GIFTCARD_WIDGET_RESIZE') {
        iframe.style.height = event.data.height + 'px';
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createWidget);
  } else {
    createWidget();
  }
})();
`;

    return {
      script,
      headers: {
        'Content-Type': 'application/javascript',
        'Cache-Control': 'public, max-age=60, must-revalidate',
      },
    };
  }
}
