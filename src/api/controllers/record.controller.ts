import { Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CreateRecordRequestDTO } from '../dtos/request/create-record.request.dto';
import { UpdateRecordRequestDTO } from '../dtos/request/update-record.request.dto';
import { RecordService } from '../services/record.service';
import { GetRecordsQueryDTO } from '../dtos/request/get-records.query.dto';
import { RecordResponseDTO } from '../dtos/response/record.response.dto';
import { Record as RecordEntity } from '../schemas/record.schema';

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
  async create(@Body() request: CreateRecordRequestDTO): Promise<RecordEntity> {
    return this.recordService.createRecord(request);
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
  ): Promise<RecordEntity> {
    return this.recordService.updateRecord(id, updateRecordDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all records with optional filters' })
  @ApiResponse({
    status: 200,
    description: 'List of records',
    type: [RecordResponseDTO],
  })
  async findAll(@Query() query: GetRecordsQueryDTO): Promise<RecordEntity[]> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    return this.recordService.searchRecords({
      q: query.q,
      artist: query.artist,
      album: query.album,
      format: query.format,
      category: query.category,
      page,
      limit,
    });
  }
}
