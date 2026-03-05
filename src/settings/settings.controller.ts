import {
  Body,
  Controller,
  Get,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../roles/roles.guard';
import { Roles } from '../roles/roles.decorator';
import { RoleEnum } from '../roles/roles.enum';
import { ApiTags } from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { Settings } from './domain/settings';

@ApiTags('Settings')
@Controller({ path: 'settings', version: '1' })
export class SettingsController {
  constructor(private readonly service: SettingsService) {}

  @Get()
  get(): Promise<Settings> {
    return this.service.get();
  }

  @Patch()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.admin)
  update(@Body() dto: UpdateSettingsDto): Promise<Settings> {
    return this.service.update(dto);
  }
}
