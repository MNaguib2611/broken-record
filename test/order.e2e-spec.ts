import { INestApplication } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Connection, Types } from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import * as request from 'supertest';
import {
  RecordCategory,
  RecordFormat,
} from '../src/api/record/schemas/record.enum';

describe('OrderController (e2e)', () => {
  let app: INestApplication;
  let mongod: MongoMemoryReplSet;
  let connection: Connection;

  beforeAll(async () => {
    mongod = await MongoMemoryReplSet.create({
      replSet: { count: 1 },
    });
    process.env.MONGO_URL = mongod.getUri();

    // Import AppModule only after MONGO_URL is set.
    const { AppModule } = await import('../src/app.module');

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    connection = app.get<Connection>(getConnectionToken());
  });

  afterEach(async () => {
    await connection.db.dropDatabase();
    jest.restoreAllMocks();
  });

  afterAll(async () => {
    await app.close();
    await mongod.stop();
  });

  it('creates an order and decrements inventory', async () => {
    const createRecordRes = await request(app.getHttpServer())
      .post('/records')
      .send({
        artist: 'The Beatles',
        album: 'Abbey Road',
        price: 30,
        qty: 10,
        format: RecordFormat.VINYL,
        category: RecordCategory.ROCK,
      })
      .expect(201);

    const recordId = createRecordRes.body._id as string;

    const createOrderRes = await request(app.getHttpServer())
      .post('/orders')
      .send({ recordId, quantity: 2 })
      .expect(201);

    expect(createOrderRes.body).toMatchObject({
      recordId,
      quantity: 2,
      unitPrice: 30,
      totalPrice: 60,
    });

    const updatedRecord = await connection
      .collection('records')
      .findOne({ _id: new Types.ObjectId(recordId) });

    expect(updatedRecord?.qty).toBe(8);
  });

  it('rejects orders when inventory is insufficient and does not decrement qty', async () => {
    const createRecordRes = await request(app.getHttpServer())
      .post('/records')
      .send({
        artist: 'The Beatles',
        album: 'Abbey Road',
        price: 30,
        qty: 1,
        format: RecordFormat.VINYL,
        category: RecordCategory.ROCK,
      })
      .expect(201);

    const recordId = createRecordRes.body._id as string;

    await request(app.getHttpServer())
      .post('/orders')
      .send({ recordId, quantity: 2 })
      .expect(400);

    const updatedRecord = await connection
      .collection('records')
      .findOne({ _id: new Types.ObjectId(recordId) });

    expect(updatedRecord?.qty).toBe(1);
  });
});
