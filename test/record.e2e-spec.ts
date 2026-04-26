import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import { getConnectionToken } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import {
  RecordCategory,
  RecordFormat,
} from '../src/api/record/schemas/record.enum';

describe('RecordController (e2e)', () => {
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

  it('creates a record and populates tracklist when mbid is provided', async () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<metadata>
  <release id="test">
    <medium-list>
      <medium>
        <track-list>
          <track><recording><title>Come Together</title></recording></track>
          <track><recording><title>Something</title></recording></track>
        </track-list>
      </medium>
    </medium-list>
  </release>
</metadata>`;

    jest.spyOn(globalThis, 'fetch' as any).mockResolvedValue({
      ok: true,
      text: async () => xml,
    } as any);

    const createRecordDto = {
      artist: 'The Beatles',
      album: 'Abbey Road',
      price: 25,
      qty: 10,
      format: RecordFormat.VINYL,
      category: RecordCategory.ROCK,
      mbid: 'd6010be3-98f8-422c-a6c9-787e2e491e58',
    };

    const response = await request(app.getHttpServer())
      .post('/records')
      .send(createRecordDto)
      .expect(201);

    expect(response.body).toHaveProperty('artist', 'The Beatles');
    expect(response.body).toHaveProperty('album', 'Abbey Road');
    expect(response.body).toHaveProperty('tracklist');
    expect(response.body.tracklist).toEqual(['Come Together', 'Something']);
  });

  it('searches records via Mongo filters and supports pagination', async () => {
    await request(app.getHttpServer())
      .post('/records')
      .send({
        artist: 'The Fake Band',
        album: 'Fake Album',
        price: 25,
        qty: 10,
        format: RecordFormat.VINYL,
        category: RecordCategory.ROCK,
      })
      .expect(201);

    await request(app.getHttpServer())
      .post('/records')
      .send({
        artist: 'The Fake Band',
        album: 'Another Album',
        price: 30,
        qty: 10,
        format: RecordFormat.VINYL,
        category: RecordCategory.ROCK,
      })
      .expect(201);

    const response = await request(app.getHttpServer())
      .get('/records?artist=The Fake Band&page=1&limit=1')
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBe(1);
    expect(response.body[0]).toHaveProperty('artist', 'The Fake Band');
  });
});
