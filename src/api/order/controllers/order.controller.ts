import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CreateOrderRequestDTO } from '../dtos/request/create-order.request.dto';
import { GetOrdersQueryDTO } from '../dtos/request/get-orders.query.dto';
import { OrderResponseDTO } from '../dtos/response/order.response.dto';
import { OrderService } from '../services/order.service';

@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Get()
  @ApiOperation({ summary: 'List orders' })
  @ApiResponse({
    status: 200,
    description: 'List of orders',
    type: [OrderResponseDTO],
  })
  async list(@Query() query: GetOrdersQueryDTO): Promise<OrderResponseDTO[]> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const orders = await this.orderService.listOrders({ page, limit });
    return orders.map((o) => new OrderResponseDTO(o));
  }

  @Post()
  @ApiOperation({ summary: 'Create an order' })
  @ApiResponse({
    status: 201,
    description: 'Order successfully created',
    type: OrderResponseDTO,
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  async create(
    @Body() request: CreateOrderRequestDTO,
  ): Promise<OrderResponseDTO> {
    const order = await this.orderService.createOrder(request);
    return new OrderResponseDTO(order);
  }
}
