import { Injectable, Logger } from '@nestjs/common';
import { XMLParser } from 'fast-xml-parser';

type Track = { title: string };

@Injectable()
export class MusicBrainzService {
  private readonly logger = new Logger(MusicBrainzService.name);
  private readonly parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
  });

  async getTracklistByReleaseMbid(
    releaseMbid: string,
  ): Promise<Track[] | null> {
    const url = new URL(`https://musicbrainz.org/ws/2/release/${releaseMbid}`);
    url.searchParams.set('inc', 'recordings');
    url.searchParams.set('fmt', 'xml');

    try {
      const res = await fetch(url.toString(), {
        headers: {
          // MusicBrainz requires a User-Agent identifying the application.
          'User-Agent': 'nestjs-hostelworld-challenge/0.0.1 (assessment)',
          Accept: 'application/xml',
        },
      });
      if (!res.ok) return null;

      const xml = await res.text();
      return this.extractTracklistFromReleaseXml(xml);
    } catch {
      // Fail open: upstream outages shouldn't block record writes.
      this.logger.warn(
        `MusicBrainz request failed for release mbid=${releaseMbid}`,
      );
      return null;
    }
  }

  extractTracklistFromReleaseXml(xml: string): Track[] {
    const parsed = this.parser.parse(xml);
    const release = parsed?.metadata?.release;
    const mediumList = release?.['medium-list']?.medium;
    const media = this.asArray(mediumList);

    const tracks: Track[] = [];
    for (const medium of media) {
      const trackList = medium?.['track-list']?.track;
      const trackArr = this.asArray(trackList);
      for (const t of trackArr) {
        const title = t?.recording?.title ?? t?.title;
        if (typeof title === 'string' && title.trim().length > 0) {
          tracks.push({ title: title.trim() });
        }
      }
    }

    return tracks;
  }

  private asArray<T>(value: T | T[] | undefined): T[] {
    if (!value) return [];
    return Array.isArray(value) ? value : [value];
  }
}
