import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { NullableType } from '../../../../../utils/types/nullable.type';
import { IPaginationOptions } from '../../../../../utils/types/pagination-options';
import { Widget } from '../../../../domain/widget';
import { WidgetRepository } from '../../widget.repository';
import { WidgetSchemaClass } from '../entities/widget.schema';
import { WidgetMapper } from '../mappers/widget.mapper';

@Injectable()
export class WidgetsDocumentRepository implements WidgetRepository {
  constructor(
    @InjectModel(WidgetSchemaClass.name)
    private readonly model: Model<WidgetSchemaClass>,
  ) {}

  async create(data: Widget): Promise<Widget> {
    const persistence = WidgetMapper.toPersistence(data);
    const created = new this.model(persistence);
    const saved = await created.save();
    return WidgetMapper.toDomain(saved);
  }

  async findManyWithPagination({
    paginationOptions,
  }: {
    paginationOptions: IPaginationOptions;
  }): Promise<Widget[]> {
    const results = await this.model
      .find()
      .sort({ createdAt: -1 })
      .skip((paginationOptions.page - 1) * paginationOptions.limit)
      .limit(paginationOptions.limit);
    return results.map(WidgetMapper.toDomain);
  }

  async findById(id: Widget['id']): Promise<NullableType<Widget>> {
    const result = await this.model.findById(id);
    return result ? WidgetMapper.toDomain(result) : null;
  }

  async findByApiKey(apiKey: string): Promise<NullableType<Widget>> {
    const result = await this.model.findOne({ apiKey });
    return result ? WidgetMapper.toDomain(result) : null;
  }

  async update(
    id: Widget['id'],
    payload: Partial<Widget>,
  ): Promise<Widget | null> {
    const existing = await this.model.findById(id);
    if (!existing) return null;

    const existingDomain = WidgetMapper.toDomain(existing);
    const merged = {
      ...existingDomain,
      ...payload,
      customization: {
        ...existingDomain.customization,
        ...payload.customization,
      },
    };
    const result = await this.model.findByIdAndUpdate(
      id,
      WidgetMapper.toPersistence(merged),
      { new: true },
    );
    return result ? WidgetMapper.toDomain(result) : null;
  }

  async remove(id: Widget['id']): Promise<void> {
    await this.model.deleteOne({ _id: id.toString() });
  }
}
