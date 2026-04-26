import { MusicBrainzService } from './musicbrainz.service';

describe('MusicBrainzService', () => {
  afterEach(() => {
    // @ts-expect-error test cleanup
    global.fetch?.mockClear?.();
  });

  it('extracts track titles from release XML', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<metadata>
  <release id="test">
    <medium-list>
      <medium>
        <track-list>
          <track>
            <recording>
              <title>Come Together</title>
            </recording>
          </track>
          <track>
            <recording>
              <title>Something</title>
            </recording>
          </track>
        </track-list>
      </medium>
    </medium-list>
  </release>
</metadata>`;

    const service = new MusicBrainzService();
    const tracks = service.extractTracklistFromReleaseXml(xml);

    expect(tracks.map((t) => t.title)).toEqual(['Come Together', 'Something']);
  });

  it('returns null when upstream responds non-200', async () => {
    (globalThis as any).fetch = jest.fn().mockResolvedValue({
      ok: false,
    });

    const service = new MusicBrainzService();
    await expect(service.getTracklistByReleaseMbid('x')).resolves.toBeNull();
  });

  it('returns null on network error (fail open)', async () => {
    (globalThis as any).fetch = jest
      .fn()
      .mockRejectedValue(new Error('network'));

    const service = new MusicBrainzService();
    await expect(service.getTracklistByReleaseMbid('x')).resolves.toBeNull();
  });
});
