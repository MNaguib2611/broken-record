import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateRecordRequestDTO } from '../dtos/request/create-record.request.dto';
import { UpdateRecordRequestDTO } from '../dtos/request/update-record.request.dto';
import { RecordCategory, RecordFormat } from '../schemas/record.enum';
import { Record as RecordEntity } from '../schemas/record.schema';
import { MusicBrainzService } from './musicbrainz.service';

@Injectable()
export class RecordService {
  private readonly logger = new Logger(RecordService.name);
  constructor(
    @InjectModel(RecordEntity.name)
    private readonly recordModel: Model<RecordEntity>,
    private readonly musicBrainzService: MusicBrainzService,
  ) {}

  async createRecord(request: CreateRecordRequestDTO): Promise<RecordEntity> {
    let tracklist: string[] = [];
    if (request.mbid) {
      try {
        const tracks = await this.musicBrainzService.getTracklistByReleaseMbid(
          request.mbid,
        );
        if (tracks) tracklist = tracks.map((t) => t.title);
      } catch {
        // Fail open: record creation should succeed even if MusicBrainz is unavailable.
        this.logger.warn(
          `Failed to enrich tracklist from MusicBrainz for mbid=${request.mbid}`,
        );
        tracklist = [];
      }
    }

    return await this.recordModel.create({
      artist: request.artist,
      album: request.album,
      price: request.price,
      qty: request.qty,
      format: request.format,
      category: request.category,
      mbid: request.mbid,
      tracklist,
    });
  }

  async updateRecord(
    id: string,
    updateRecordDto: UpdateRecordRequestDTO,
  ): Promise<RecordEntity> {
    const record = await this.recordModel.findById(id);
    if (!record) {
      throw new NotFoundException('Record not found');
    }

    const previousMbid = record.mbid;
    Object.assign(record, updateRecordDto);

    // Only refetch tracklist when mbid is explicitly changed (avoid extra network calls on other updates).
    const mbidChanged =
      updateRecordDto.mbid !== undefined &&
      updateRecordDto.mbid !== previousMbid;

    if (mbidChanged) {
      if (!updateRecordDto.mbid) {
        record.tracklist = [];
      } else {
        try {
          const tracks =
            await this.musicBrainzService.getTracklistByReleaseMbid(
              updateRecordDto.mbid,
            );
          record.tracklist = tracks ? tracks.map((t) => t.title) : [];
        } catch {
          // Fail open: preserve update semantics even if MusicBrainz is unavailable.
          this.logger.warn(
            `Failed to refresh tracklist from MusicBrainz for mbid=${updateRecordDto.mbid}`,
          );
          record.tracklist = [];
        }
      }
    }

    return await record.save();
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
