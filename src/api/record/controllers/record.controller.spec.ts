import { Test, TestingModule } from '@nestjs/testing';
import { CreateRecordRequestDTO } from '../dtos/request/create-record.request.dto';
import { GetRecordsQueryDTO } from '../dtos/request/get-records.query.dto';
import { RecordCategory, RecordFormat } from '../schemas/record.enum';
import { RecordController } from './record.controller';
import { RecordService } from '../services/record.service';

describe('RecordController', () => {
  let recordController: RecordController;
  let recordService: RecordService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RecordController],
      providers: [
        {
          provide: RecordService,
          useValue: {
            createRecord: jest.fn(),
            updateRecord: jest.fn(),
            searchRecords: jest.fn(),
          },
        },
      ],
    }).compile();

    recordController = module.get<RecordController>(RecordController);
    recordService = module.get<RecordService>(RecordService);
  });

  it('should create a new record', async () => {
    const createRecordDto: CreateRecordRequestDTO = {
      artist: 'Test',
      album: 'Test Record',
      price: 100,
      qty: 10,
      format: RecordFormat.VINYL,
      category: RecordCategory.ALTERNATIVE,
    };

    const savedRecord = {
      _id: '1',
      artist: 'Test',
      album: 'Test Record',
      price: 100,
      qty: 10,
      format: RecordFormat.VINYL,
      category: RecordCategory.ALTERNATIVE,
      created: new Date('2026-01-01T00:00:00.000Z'),
      lastModified: new Date('2026-01-01T00:00:00.000Z'),
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      tracklist: [],
    };

    jest
      .spyOn(recordService, 'createRecord')
      .mockResolvedValue(savedRecord as any);

    const result = await recordController.create(createRecordDto);
    expect(result).toEqual({
      _id: '1',
      artist: 'Test',
      album: 'Test Record',
      price: 100,
      qty: 10,
      format: RecordFormat.VINYL,
      category: RecordCategory.ALTERNATIVE,
      mbid: undefined,
      created: savedRecord.created,
      lastModified: savedRecord.lastModified,
      createdAt: savedRecord.createdAt,
      updatedAt: savedRecord.updatedAt,
      tracklist: [],
    });
    expect(recordService.createRecord).toHaveBeenCalledWith(createRecordDto);
  });

  it('should return an array of records', async () => {
    const records = [
      {
        _id: '1',
        artist: 'A',
        album: 'B',
        price: 100,
        qty: 10,
        format: RecordFormat.VINYL,
        category: RecordCategory.ROCK,
        created: new Date('2026-01-01T00:00:00.000Z'),
        lastModified: new Date('2026-01-01T00:00:00.000Z'),
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-01T00:00:00.000Z'),
        tracklist: ['t1'],
      },
      {
        _id: '2',
        artist: 'C',
        album: 'D',
        price: 200,
        qty: 20,
        format: RecordFormat.CD,
        category: RecordCategory.JAZZ,
        created: new Date('2026-01-02T00:00:00.000Z'),
        lastModified: new Date('2026-01-02T00:00:00.000Z'),
        createdAt: new Date('2026-01-02T00:00:00.000Z'),
        updatedAt: new Date('2026-01-02T00:00:00.000Z'),
        tracklist: [],
      },
    ];

    jest
      .spyOn(recordService, 'searchRecords')
      .mockResolvedValue(records as any);

    const result = await recordController.findAll({} as GetRecordsQueryDTO);
    expect(result).toEqual([
      {
        _id: '1',
        artist: 'A',
        album: 'B',
        price: 100,
        qty: 10,
        format: RecordFormat.VINYL,
        category: RecordCategory.ROCK,
        mbid: undefined,
        created: records[0].created,
        lastModified: records[0].lastModified,
        createdAt: records[0].createdAt,
        updatedAt: records[0].updatedAt,
        tracklist: ['t1'],
      },
      {
        _id: '2',
        artist: 'C',
        album: 'D',
        price: 200,
        qty: 20,
        format: RecordFormat.CD,
        category: RecordCategory.JAZZ,
        mbid: undefined,
        created: records[1].created,
        lastModified: records[1].lastModified,
        createdAt: records[1].createdAt,
        updatedAt: records[1].updatedAt,
        tracklist: [],
      },
    ]);
    expect(recordService.searchRecords).toHaveBeenCalledWith({
      q: undefined,
      artist: undefined,
      album: undefined,
      format: undefined,
      category: undefined,
      page: 1,
      limit: 20,
    });
  });
});
