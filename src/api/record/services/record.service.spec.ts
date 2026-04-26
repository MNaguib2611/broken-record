import { RecordService } from './record.service';
import { MusicBrainzService } from './musicbrainz.service';
import { RecordCategory, RecordFormat } from '../schemas/record.enum';

describe('RecordService', () => {
  it('creates a record with empty tracklist when mbid is missing', async () => {
    const recordModel: any = { create: jest.fn().mockResolvedValue({ _id: '1' }) };
    const musicBrainz: any = { getTracklistByReleaseMbid: jest.fn() };

    const service = new RecordService(
      recordModel,
      musicBrainz as MusicBrainzService,
    );

    await service.createRecord({
      artist: 'A',
      album: 'B',
      price: 10,
      qty: 1,
      format: RecordFormat.VINYL,
      category: RecordCategory.ROCK,
    } as any);

    expect(musicBrainz.getTracklistByReleaseMbid).not.toHaveBeenCalled();
    expect(recordModel.create).toHaveBeenCalledWith(
      expect.objectContaining({ tracklist: [] }),
    );
  });

  it('fetches tracklist on create when mbid is provided', async () => {
    const recordModel: any = { create: jest.fn().mockResolvedValue({ _id: '1' }) };
    const musicBrainz: any = {
      getTracklistByReleaseMbid: jest.fn().mockResolvedValue([
        { title: 't1' },
        { title: 't2' },
      ]),
    };

    const service = new RecordService(recordModel, musicBrainz as MusicBrainzService);

    await service.createRecord({
      artist: 'A',
      album: 'B',
      price: 10,
      qty: 1,
      format: RecordFormat.VINYL,
      category: RecordCategory.ROCK,
      mbid: 'mbid1',
    } as any);

    expect(musicBrainz.getTracklistByReleaseMbid).toHaveBeenCalledWith('mbid1');
    expect(recordModel.create).toHaveBeenCalledWith(
      expect.objectContaining({ tracklist: ['t1', 't2'] }),
    );
  });

  it('fails open on create when MusicBrainz throws', async () => {
    const recordModel: any = { create: jest.fn().mockResolvedValue({ _id: '1' }) };
    const musicBrainz: any = {
      getTracklistByReleaseMbid: jest.fn().mockRejectedValue(new Error('down')),
    };

    const service = new RecordService(
      recordModel,
      musicBrainz as MusicBrainzService,
    );

    await service.createRecord({
      artist: 'A',
      album: 'B',
      price: 10,
      qty: 1,
      format: RecordFormat.VINYL,
      category: RecordCategory.ROCK,
      mbid: 'mbid1',
    } as any);

    expect(recordModel.create).toHaveBeenCalledWith(
      expect.objectContaining({ tracklist: [] }),
    );
  });

  it('refetches tracklist only when mbid changes on update', async () => {
    const record = {
      _id: '1',
      mbid: 'old',
      tracklist: ['oldTrack'],
    };

    const recordModel: any = {
      findById: jest.fn().mockResolvedValue(record),
      updateOne: jest.fn().mockResolvedValue({ acknowledged: true }),
    };

    const musicBrainz: any = {
      getTracklistByReleaseMbid: jest.fn().mockResolvedValue([{ title: 'newTrack' }]),
    };

    const service = new RecordService(recordModel, musicBrainz as MusicBrainzService);

    // MBID omitted → should not refetch.
    await service.updateRecord('1', { price: 20 } as any);
    expect(musicBrainz.getTracklistByReleaseMbid).not.toHaveBeenCalled();

    // Same MBID → should not refetch.
    await service.updateRecord('1', { mbid: 'old' } as any);
    expect(musicBrainz.getTracklistByReleaseMbid).not.toHaveBeenCalled();

    // Changed MBID → should refetch and update tracklist.
    await service.updateRecord('1', { mbid: 'new' } as any);
    expect(musicBrainz.getTracklistByReleaseMbid).toHaveBeenCalledWith('new');
    expect(record.tracklist).toEqual(['newTrack']);
  });

  it('clears tracklist when mbid is removed', async () => {
    const record = { _id: '1', mbid: 'old', tracklist: ['t'] };
    const recordModel: any = {
      findById: jest.fn().mockResolvedValue(record),
      updateOne: jest.fn().mockResolvedValue({ acknowledged: true }),
    };
    const musicBrainz: any = { getTracklistByReleaseMbid: jest.fn() };

    const service = new RecordService(
      recordModel,
      musicBrainz as MusicBrainzService,
    );

    await service.updateRecord('1', { mbid: undefined } as any);

    // Note: mbid undefined means "not provided" (no change). Use empty string/null as "removed".
    expect(record.tracklist).toEqual(['t']);

    await service.updateRecord('1', { mbid: '' } as any);
    expect(record.tracklist).toEqual([]);
  });

  it('fails open on update when MusicBrainz throws', async () => {
    const record = { _id: '1', mbid: 'old', tracklist: ['t'] };
    const recordModel: any = {
      findById: jest.fn().mockResolvedValue(record),
      updateOne: jest.fn().mockResolvedValue({ acknowledged: true }),
    };
    const musicBrainz: any = {
      getTracklistByReleaseMbid: jest.fn().mockRejectedValue(new Error('down')),
    };

    const service = new RecordService(
      recordModel,
      musicBrainz as MusicBrainzService,
    );

    await service.updateRecord('1', { mbid: 'new' } as any);
    expect(record.tracklist).toEqual([]);
  });

  it('throws when record is not found on update', async () => {
    const recordModel: any = { findById: jest.fn().mockResolvedValue(null) };
    const musicBrainz: any = { getTracklistByReleaseMbid: jest.fn() };
    const service = new RecordService(
      recordModel,
      musicBrainz as MusicBrainzService,
    );

    await expect(service.updateRecord('missing', {} as any)).rejects.toThrow(
      'Record not found',
    );
  });

  it('builds Mongo search query with pagination and sort', async () => {
    const exec = jest.fn().mockResolvedValue([]);
    const query = {
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      lean: jest.fn().mockReturnThis(),
      exec,
    };

    const recordModel: any = {
      find: jest.fn().mockReturnValue(query),
    };

    const service = new RecordService(
      recordModel,
      { getTracklistByReleaseMbid: jest.fn() } as any,
    );

    await service.searchRecords({
      q: 'beatles',
      artist: 'The Beatles',
      album: 'Abbey Road',
      format: RecordFormat.VINYL,
      category: RecordCategory.ROCK,
      page: 2,
      limit: 10,
    });

    expect(recordModel.find).toHaveBeenCalledWith({
      $text: { $search: 'beatles' },
      artist: 'The Beatles',
      album: 'Abbey Road',
      format: RecordFormat.VINYL,
      category: RecordCategory.ROCK,
    });
    expect(query.skip).toHaveBeenCalledWith(10);
    expect(query.limit).toHaveBeenCalledWith(10);
    expect(query.sort).toHaveBeenCalledWith({ score: { $meta: 'textScore' } });
    expect(exec).toHaveBeenCalled();
  });
});

