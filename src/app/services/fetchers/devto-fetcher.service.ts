import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map, catchError, of } from 'rxjs';
import { DEVTO_TAGS } from '../../data/topic-tags';

/** Shape of a single article as returned by the Dev.to public API. */
export interface DevToArticle {
  id: number;
  title: string;
  description: string | null;
  url: string;
  published_at: string;
  tag_list: string[];
  cover_image: string | null;
  public_reactions_count: number;
  user: {
    name: string | null;
  };
}

const DEVTO_API_BASE = 'https://dev.to/api/articles';

/** Fetches Dev.to articles for each configured tag and merges/de-dupes the results. */
@Injectable({ providedIn: 'root' })
export class DevToFetcherService {
  private readonly http = inject(HttpClient);

  fetchArticles(): Observable<DevToArticle[]> {
    const requests = DEVTO_TAGS.map((tag) =>
      this.http.get<DevToArticle[]>(DEVTO_API_BASE, { params: { tag, per_page: 20 } }).pipe(
        catchError(() => of<DevToArticle[]>([])),
      ),
    );

    return forkJoin(requests).pipe(
      map((responses) => {
        const byId = new Map<number, DevToArticle>();
        for (const articles of responses) {
          for (const article of articles) {
            byId.set(article.id, article);
          }
        }
        return Array.from(byId.values());
      }),
    );
  }
}
