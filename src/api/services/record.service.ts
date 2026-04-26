import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateRecordRequestDTO } from '../dtos/request/create-record.request.dto';
import { UpdateRecordRequestDTO } from '../dtos/request/update-record.request.dto';
import { RecordCategory, RecordFormat } from '../schemas/record.enum';
import { Record as RecordEntity } from '../schemas/record.schema';

@Injectable()
export class RecordService {
  constructor(
    @InjectModel(RecordEntity.name)
    private readonly recordModel: Model<RecordEntity>,
  ) {}

  async createRecord(request: CreateRecordRequestDTO): Promise<RecordEntity> {
    return await this.recordModel.create({
      artist: request.artist,
      album: request.album,
      price: request.price,
      qty: request.qty,
      format: request.format,
      category: request.category,
      mbid: request.mbid,
    });
  }

  async updateRecord(
    id: string,
    updateRecordDto: UpdateRecordRequestDTO,
  ): Promise<RecordEntity> {
    const record = await this.recordModel.findById(id);
    if (!record) {
      throw new InternalServerErrorException('Record not found');
    }

    Object.assign(record, updateRecordDto);

    const updated = await this.recordModel.updateOne(record);
    if (!updated) {
      throw new InternalServerErrorException('Failed to update record');
    }

    return record;
  }
  async searchRecords(params: {
    q?: string;
    artist?: string;
    album?: string;
    format?: RecordFormat;
    category?: RecordCategory;
    page: number;
    limit: number;
  }): Promise<RecordEntity[]> {
    const skip = (params.page - 1) * params.limit;

    const filter: globalThis.Record<string, unknown> = {};
    if (params.q) filter.$text = { $search: params.q };
    if (params.artist) filter.artist = params.artist;
    if (params.album) filter.album = params.album;
    if (params.format) filter.format = params.format;
    if (params.category) filter.category = params.category;

    const query = this.recordModel
      .find(filter)
      .skip(skip)
      .limit(params.limit)
      .lean();

    if (params.q) {
      query.sort({ score: { $meta: 'textScore' } });
    } else {
      query.sort({ createdAt: -1 });
    }

    return (await query.exec()) as any;
  }
}
