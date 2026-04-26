import { ApiProperty } from '@nestjs/swagger';

export class OrderResponseDTO {
  constructor(order: any) {
    this._id = String(order._id);
    this.recordId = String(order.recordId);
    this.quantity = order.quantity;
    this.unitPrice = order.unitPrice;
    this.totalPrice = order.totalPrice;
    this.createdAt = order.createdAt;
    this.updatedAt = order.updatedAt;
  }

  @ApiProperty({ example: '69ee0d1b0e40121732a8227c' })
  _id: string;

  @ApiProperty({ example: '69ee0af40e40121732a8227b' })
  recordId: string;

  @ApiProperty({ example: 2 })
  quantity: number;

  @ApiProperty({ example: 30 })
  unitPrice: number;

  @ApiProperty({ example: 60 })
  totalPrice: number;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt: Date;
}
