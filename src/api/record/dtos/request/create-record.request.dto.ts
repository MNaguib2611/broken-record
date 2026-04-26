import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { RecordFormat, RecordCategory } from '../../schemas/record.enum';

export class CreateRecordRequestDTO {
  @ApiProperty({
    description: 'Artist of the record',
    type: String,
    example: 'The Beatles',
  })
  @IsString()
  @IsNotEmpty()
  artist: string;

  @ApiProperty({
    description: 'Album name',
    type: String,
    example: 'Abbey Road',
  })
  @IsString()
  @IsNotEmpty()
  album: string;

  @ApiProperty({
    description: 'Price of the record',
    type: Number,
    example: 30,
  })
  @IsNumber()
  @Min(0)
  @Max(10000)
  price: number;

  @ApiProperty({
    description: 'Quantity of the record in stock',
    type: Number,
    example: 100,
  })
  @IsInt()
  @Min(0)
  @Max(100)
  qty: number;

  @ApiProperty({
    description: 'Format of the record (Vinyl, CD, etc.)',
    enum: RecordFormat,
    example: RecordFormat.VINYL,
  })
  @IsEnum(RecordFormat)
  @IsNotEmpty()
  format: RecordFormat;

  @ApiProperty({
    description: 'Category or genre of the record (e.g., Rock, Jazz)',
    enum: RecordCategory,
    example: RecordCategory.ROCK,
  })
  @IsEnum(RecordCategory)
  @IsNotEmpty()
  category: RecordCategory;

  @ApiProperty({
    description:
      'MusicBrainz Release MBID (edition-level) used to fetch tracklist (XML)',
    type: String,
    example: 'd6010be3-98f8-422c-a6c9-787e2e491e58',
  })
  @IsOptional()
  mbid?: string;
}
