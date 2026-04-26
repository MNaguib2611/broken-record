import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model, Types } from 'mongoose';
import { CreateOrderRequestDTO } from '../dtos/request/create-order.request.dto';
import { Order } from '../schemas/order.schema';
import { Record } from '../../record/schemas/record.schema';

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);
  constructor(
    @InjectConnection()
    private readonly connection: Connection,
    @InjectModel(Order.name)
    private readonly orderModel: Model<Order>,
    @InjectModel(Record.name)
    private readonly recordModel: Model<Record>,
  ) {}

  async createOrder(request: CreateOrderRequestDTO): Promise<Order> {
    const recordObjectId = new Types.ObjectId(request.recordId);

    const session = await this.connection.startSession();
    try {
      let createdOrder: Order | null = null;

      await session.withTransaction(async () => {
        const record = await this.recordModel.findOneAndUpdate(
          { _id: recordObjectId, qty: { $gte: request.quantity } },
          { $inc: { qty: -request.quantity } },
          { new: true, session },
        );

        if (!record) {
          const existing = await this.recordModel
            .findById(recordObjectId)
            .session(session);
          if (!existing) throw new NotFoundException('Record not found');
          throw new BadRequestException('Insufficient inventory');
        }

        const unitPrice = record.price;
        const totalPrice = unitPrice * request.quantity;

        const [order] = await this.orderModel.create(
          [
            {
              recordId: recordObjectId,
              quantity: request.quantity,
              unitPrice,
              totalPrice,
            },
          ],
          { session },
        );
        createdOrder = order;
      });

      if (!createdOrder) {
        throw new BadRequestException('Failed to create order');
      }

      return createdOrder;
    } catch (err) {
      this.logger.warn(
        `Order creation failed recordId=${request.recordId} qty=${request.quantity}`,
      );
      throw err;
    } finally {
      await session.endSession();
    }
  }

  async listOrders(params: { page: number; limit: number }): Promise<Order[]> {
    const skip = (params.page - 1) * params.limit;
    return (await this.orderModel
      .find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(params.limit)
      .lean()
      .exec()) as any;
  }
}
