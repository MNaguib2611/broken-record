import { Test, TestingModule } from '@nestjs/testing';
import { CreateOrderRequestDTO } from '../dtos/request/create-order.request.dto';
import { GetOrdersQueryDTO } from '../dtos/request/get-orders.query.dto';
import { OrderController } from './order.controller';
import { OrderService } from '../services/order.service';

describe('OrderController', () => {
  let controller: OrderController;
  let service: OrderService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrderController],
      providers: [
        {
          provide: OrderService,
          useValue: {
            createOrder: jest.fn(),
            listOrders: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<OrderController>(OrderController);
    service = module.get<OrderService>(OrderService);
  });

  it('creates an order and returns response DTO shape', async () => {
    const dto: CreateOrderRequestDTO = {
      recordId: '69ee0af40e40121732a8227b',
      quantity: 2,
    };
    const createdAt = new Date('2026-01-01T00:00:00.000Z');
    const updatedAt = new Date('2026-01-01T00:00:00.000Z');

    jest.spyOn(service, 'createOrder').mockResolvedValue({
      _id: 'o1',
      recordId: dto.recordId,
      quantity: dto.quantity,
      unitPrice: 30,
      totalPrice: 60,
      createdAt,
      updatedAt,
    } as any);

    await expect(controller.create(dto)).resolves.toEqual({
      _id: 'o1',
      recordId: dto.recordId,
      quantity: 2,
      unitPrice: 30,
      totalPrice: 60,
      createdAt,
      updatedAt,
    });
    expect(service.createOrder).toHaveBeenCalledWith(dto);
  });

  it('lists orders with default pagination', async () => {
    jest.spyOn(service, 'listOrders').mockResolvedValue([] as any);
    await expect(controller.list({} as GetOrdersQueryDTO)).resolves.toEqual([]);
    expect(service.listOrders).toHaveBeenCalledWith({ page: 1, limit: 20 });
  });

  it('lists orders with provided pagination', async () => {
    jest.spyOn(service, 'listOrders').mockResolvedValue([] as any);
    await controller.list({ page: 3, limit: 5 } as any);
    expect(service.listOrders).toHaveBeenCalledWith({ page: 3, limit: 5 });
  });
});
