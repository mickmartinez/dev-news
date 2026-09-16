import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map } from 'rxjs';
import { DEVTO_TAGS } from '../../data/topic-tags';

/** Shape of a single story hit from the Hacker News (Algolia) search API. */
export interface HackerNewsHit {
  objectID: string;
  title: string | null;
  url: string | null;
  author: string;
  points: number | null;
  created_at: string;
  _tags: string[];
}

interface HackerNewsSearchResponse {
  hits: HackerNewsHit[];
}

const HN_ALGOLIA_API = 'https://hn.algolia.com/api/v1/search';

/** Fetches top Hacker News stories matching the Dev.to tag set and merges/de-dupes results. */
@Injectable({ providedIn: 'root' })
export class HackerNewsFetcherService {
  private readonly http = inject(HttpClient);

  fetchArticles(): Observable<HackerNewsHit[]> {
    const requests = DEVTO_TAGS.map((tag) =>
      this.http.get<HackerNewsSearchResponse>(HN_ALGOLIA_API, {
        params: { query: tag, tags: 'story', hitsPerPage: 20 },
      }),
    );

    return forkJoin(requests).pipe(
      map((responses) => {
        const byId = new Map<string, HackerNewsHit>();
        for (const response of responses) {
          for (const hit of response.hits) {
            byId.set(hit.objectID, hit);
          }
        }
        return Array.from(byId.values());
      }),
    );
  }
}
