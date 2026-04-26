import { Test, TestingModule } from '@nestjs/testing';
import { RecordController } from './record.controller';
import { CreateRecordRequestDTO } from '../dtos/request/create-record.request.dto';
import { RecordCategory, RecordFormat } from '../schemas/record.enum';
import { RecordService } from '../services/record.service';
import { GetRecordsQueryDTO } from '../dtos/request/get-records.query.dto';

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
      name: 'Test Record',
      price: 100,
      qty: 10,
    };

    jest
      .spyOn(recordService, 'createRecord')
      .mockResolvedValue(savedRecord as any);

    const result = await recordController.create(createRecordDto);
    expect(result).toEqual(savedRecord);
    expect(recordService.createRecord).toHaveBeenCalledWith(createRecordDto);
  });

  it('should return an array of records', async () => {
    const records = [
      { _id: '1', name: 'Record 1', price: 100, qty: 10 },
      { _id: '2', name: 'Record 2', price: 200, qty: 20 },
    ];

    jest
      .spyOn(recordService, 'searchRecords')
      .mockResolvedValue(records as any);

    const result = await recordController.findAll({} as GetRecordsQueryDTO);
    expect(result).toEqual(records);
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
