import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { DEVNEWS_TAGS } from '../../data/topic-tags';

/** Shape of a single repository as returned by the GitHub Search API. */
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

/** Fetches trending GitHub repositories matching any of the configured topic tags. */
@Injectable({ providedIn: 'root' })
export class GitHubFetcherService {
  private readonly http = inject(HttpClient);

  fetchArticles(): Observable<GitHubRepo[]> {
    const topicQuery = DEVNEWS_TAGS.map((tag) => `topic:${tag}`).join(' OR ');

    return this.http
      .get<GitHubSearchResponse>(GITHUB_SEARCH_API, {
        params: { q: topicQuery, sort: 'stars', order: 'desc', per_page: 30 },
      })
      .pipe(map((response) => response.items));
  }
}
