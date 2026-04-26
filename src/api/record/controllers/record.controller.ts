import { Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CreateRecordRequestDTO } from '../dtos/request/create-record.request.dto';
import { GetRecordsQueryDTO } from '../dtos/request/get-records.query.dto';
import { UpdateRecordRequestDTO } from '../dtos/request/update-record.request.dto';
import { RecordResponseDTO } from '../dtos/response/record.response.dto';
import { RecordService } from '../services/record.service';

@Controller('records')
export class RecordController {
  constructor(private readonly recordService: RecordService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new record' })
  @ApiResponse({
    status: 201,
    description: 'Record successfully created',
    type: RecordResponseDTO,
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  async create(
    @Body() request: CreateRecordRequestDTO,
  ): Promise<RecordResponseDTO> {
    const record = await this.recordService.createRecord(request);
    return new RecordResponseDTO(record);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an existing record' })
  @ApiResponse({
    status: 200,
    description: 'Record updated successfully',
    type: RecordResponseDTO,
  })
  @ApiResponse({ status: 500, description: 'Cannot find record to update' })
  async update(
    @Param('id') id: string,
    @Body() updateRecordDto: UpdateRecordRequestDTO,
  ): Promise<RecordResponseDTO> {
    const record = await this.recordService.updateRecord(id, updateRecordDto);
    return new RecordResponseDTO(record);
  }

  @Get()
  @ApiOperation({ summary: 'Get all records with optional filters' })
  @ApiResponse({
    status: 200,
    description: 'List of records',
    type: [RecordResponseDTO],
  })
  async findAll(
    @Query() query: GetRecordsQueryDTO,
  ): Promise<RecordResponseDTO[]> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const records = await this.recordService.searchRecords({
      q: query.q,
      artist: query.artist,
      album: query.album,
      format: query.format,
      category: query.category,
      page,
      limit,
    });
    return records.map((r) => new RecordResponseDTO(r));
  }
}
