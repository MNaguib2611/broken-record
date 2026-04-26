import { ApiProperty } from '@nestjs/swagger';
import { RecordCategory, RecordFormat } from '../../schemas/record.enum';

export class RecordResponseDTO {
  constructor(record: any) {
    this._id = String(record._id);
    this.artist = record.artist;
    this.album = record.album;
    this.price = record.price;
    this.qty = record.qty;
    this.format = record.format;
    this.category = record.category;
    this.mbid = record.mbid;
    this.created = record.created;
    this.lastModified = record.lastModified;
    this.createdAt = record.createdAt;
    this.updatedAt = record.updatedAt;
    this.tracklist = Array.isArray(record.tracklist) ? record.tracklist : [];
  }

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

  @ApiProperty({ type: [String], example: ['Come Together', 'Something'] })
  tracklist: string[];
}
