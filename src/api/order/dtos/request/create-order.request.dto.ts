import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsMongoId, Min } from 'class-validator';

export class CreateOrderRequestDTO {
  @ApiProperty({
    description: 'Record id to order',
    example: '69ee0af40e40121732a8227b',
  })
  @IsMongoId()
  recordId: string;

  @ApiProperty({
    description: 'Quantity of records being ordered',
    example: 1,
  })
  @IsInt()
  @Min(1)
  quantity: number;
}
