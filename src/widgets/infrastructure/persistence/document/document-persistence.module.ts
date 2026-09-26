import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WidgetSchema, WidgetSchemaClass } from './entities/widget.schema';
import { WidgetRepository } from '../widget.repository';
import { WidgetsDocumentRepository } from './repositories/widget.repository';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: WidgetSchemaClass.name, schema: WidgetSchema },
    ]),
  ],
  providers: [
    {
      provide: WidgetRepository,
      useClass: WidgetsDocumentRepository,
    },
  ],
  exports: [WidgetRepository],
})
export class DocumentWidgetPersistenceModule {}
