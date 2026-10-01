import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { DEVNEWS_TAGS } from '../../data/topic-tags';

/** Shape of a single learning path/module entry from the Microsoft Learn Catalog API. */
export interface MsLearnCatalogEntry {
  uid: string;
  title: string;
  summary: string | null;
  url: string;
  last_modified: string | null;
  duration_in_minutes: number | null;
  /** DEVNEWS_TAGS topics found in the title/summary; always non-empty, since fetchArticles() only keeps matching entries. */
  matchedTopics: string[];
}

interface MsLearnCatalogResponse {
  learningPaths: MsLearnCatalogEntry[];
  modules: MsLearnCatalogEntry[];
}

const MSLEARN_CATALOG_API = 'https://learn.microsoft.com/api/catalog';

/** Fetches Microsoft Learn learning paths/modules filtered to the configured AI topics. */
@Injectable({ providedIn: 'root' })
export class MsLearnFetcherService {
  private readonly http = inject(HttpClient);

  fetchArticles(): Observable<MsLearnCatalogEntry[]> {
    return this.http
      .get<MsLearnCatalogResponse>(MSLEARN_CATALOG_API, { params: { locale: 'en-us' } })
      .pipe(
        map((response) => {
          const combined = [...response.learningPaths, ...response.modules];
          return combined
            .map((entry) => ({ ...entry, matchedTopics: this.matchedTopics(entry) }))
            .filter((entry) => entry.matchedTopics.length > 0);
        }),
      );
  }

  private matchedTopics(entry: MsLearnCatalogEntry): string[] {
    const haystack = `${entry.title} ${entry.summary ?? ''}`.toLowerCase();
    return DEVNEWS_TAGS.filter((topic) => haystack.includes(topic.toLowerCase()));
  }
}
