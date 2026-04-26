import { ApiProperty } from '@nestjs/swagger';
import { RecordCategory, RecordFormat } from '../../schemas/record.enum';

export class RecordResponseDTO {
  @ApiProperty({ example: '69ee05c6f02dcb5282c053a4' })
  _id: string;

  @ApiProperty({ example: 'The Beatles' })
  artist: string;

  @ApiProperty({ example: 'Abbey Road' })
  album: string;

  @ApiProperty({ example: 30 })
  price: number;

  @ApiProperty({ example: 100 })
  qty: number;

  @ApiProperty({ enum: RecordFormat, example: RecordFormat.VINYL })
  format: RecordFormat;

  @ApiProperty({ enum: RecordCategory, example: RecordCategory.ROCK })
  category: RecordCategory;

  @ApiProperty({
    required: false,
    example: 'b10bbbfc-cf9e-42e0-be17-e2c3e1d2600d',
  })
  mbid?: string;

  @ApiProperty({ type: String, format: 'date-time' })
  created: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  lastModified: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt: Date;

  @ApiProperty({ example: 0 })
  __v: number;
}

