import { BadRequestException } from '@nestjs/common';
import { OrderService } from './order.service';

describe('OrderService', () => {
  it('throws when inventory is insufficient', async () => {
    const connection: any = {
      startSession: jest.fn().mockResolvedValue({
        withTransaction: async (fn: () => Promise<void>) => {
          await fn();
        },
        endSession: jest.fn(),
      }),
    };

    const orderModel: any = { create: jest.fn() };
    const recordModel: any = {
      findOneAndUpdate: jest.fn().mockResolvedValue(null),
    };

    const service = new OrderService(connection, orderModel, recordModel);

    await expect(
      service.createOrder({
        recordId: '69ee0af40e40121732a8227b',
        quantity: 2,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
