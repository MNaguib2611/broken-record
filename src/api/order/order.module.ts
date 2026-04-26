import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OrderController } from './controllers/order.controller';
import { OrderService } from './services/order.service';
import { OrderSchema } from './schemas/order.schema';
import { RecordSchema } from '../record/schemas/record.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Order', schema: OrderSchema },
      // Needed here for atomic inventory updates inside OrderService.
      { name: 'Record', schema: RecordSchema },
    ]),
  ],
  controllers: [OrderController],
  providers: [OrderService],
})
export class OrderModule {}
