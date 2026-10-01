import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, from, map, catchError, of, toArray, mergeMap } from 'rxjs';
import { DEVNEWS_TAGS } from '../../data/topic-tags';

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  stargazers_count: number;
  pushed_at: string;
  topics: string[];
  owner: {
    login: string;
    avatar_url: string;
  };
}

interface GitHubSearchResponse {
  items: GitHubRepo[];
}

const GITHUB_SEARCH_API = 'https://api.github.com/search/repositories';

@Injectable({ providedIn: 'root' })
export class GitHubFetcherService {
  private readonly http = inject(HttpClient);

  fetchArticles(): Observable<GitHubRepo[]> {
    // GitHub permits at most 5 boolean operators per search query, so tags are
    // batched into groups of 6 terms (5 "OR"s) joined as plain text — "topic:"
    // qualifiers can't be OR'd (GitHub rejects qualifier-only OR queries), and
    // one request per tag would blow past the unauthenticated 10 req/min search limit.
    const chunkSize = 6;
    const chunks: string[][] = [];
    for (let i = 0; i < DEVNEWS_TAGS.length; i += chunkSize) {
      chunks.push(DEVNEWS_TAGS.slice(i, i + chunkSize) as string[]);
    }

    return from(chunks).pipe(
      mergeMap((chunk) => {
        const query = chunk.map((tag) => (tag.includes(' ') ? `"${tag}"` : tag)).join(' OR ');

        return this.http.get<GitHubSearchResponse>(GITHUB_SEARCH_API, {
          params: { q: query, sort: 'stars', order: 'desc', per_page: 30 },
        }).pipe(
          catchError((err) => {
            console.error(`GitHub fetch failed for query: ${query}`, err);
            return of<GitHubSearchResponse>({ items: [] });
          })
        );
      }, 2),
      
      toArray(),
      
      map((responses) => {
        const byId = new Map<number, GitHubRepo>();
        
        for (const response of responses) {
          for (const repo of response.items) {
            byId.set(repo.id, repo);
          }
        }
        
        return Array.from(byId.values()).sort(
          (a, b) => b.stargazers_count - a.stargazers_count
        );
      })
    );
  }
}