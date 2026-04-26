import { MusicBrainzService } from './musicbrainz.service';

describe('MusicBrainzService', () => {
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
});
