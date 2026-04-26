import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RecordController } from './controllers/record.controller';
import { MusicBrainzService } from './services/musicbrainz.service';
import { RecordService } from './services/record.service';
import { RecordSchema } from './schemas/record.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Record', schema: RecordSchema }]),
  ],
  controllers: [RecordController],
  providers: [RecordService, MusicBrainzService],
})
export class RecordModule {}
