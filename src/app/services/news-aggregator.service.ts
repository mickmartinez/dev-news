import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map, catchError, of } from 'rxjs';
import { ArticleSource, UnifiedArticle } from '../models/article.model';
import { ArticleNormalizerService } from './article-normalizer.service';
import { DevToFetcherService } from './fetchers/devto-fetcher.service';
import { MsLearnFetcherService } from './fetchers/mslearn-fetcher.service';
import { HackerNewsFetcherService } from './fetchers/hackernews-fetcher.service';
import { HashnodeFetcherService } from './fetchers/hashnode-fetcher.service';
import { GitHubFetcherService } from './fetchers/github-fetcher.service';

/** Result of a feed load: successfully normalized articles plus any sources that failed. */
export interface NewsFeedResult {
  articles: UnifiedArticle[];
  failedSources: ArticleSource[];
}

interface SourceFetchOutcome {
  source: ArticleSource;
  articles: UnifiedArticle[];
  failed: boolean;
}

/**
 * Orchestrates parallel, live fetches across all 5 sources, normalizes each
 * into `UnifiedArticle`, and merges them into a single chronologically sorted
 * feed. A failure in one source is isolated via `catchError` and does not
 * block the others (see docs/PRODUCT_SPEC.md, User Story A1).
 */
@Injectable({ providedIn: 'root' })
export class NewsAggregatorService {
  private readonly normalizer = inject(ArticleNormalizerService);
  private readonly devToFetcher = inject(DevToFetcherService);
  private readonly msLearnFetcher = inject(MsLearnFetcherService);
  private readonly hackerNewsFetcher = inject(HackerNewsFetcherService);
  private readonly hashnodeFetcher = inject(HashnodeFetcherService);
  private readonly gitHubFetcher = inject(GitHubFetcherService);

  fetchFeed(): Observable<NewsFeedResult> {
    const devTo$ = this.devToFetcher.fetchArticles().pipe(
      map((articles): SourceFetchOutcome => ({
        source: 'devto',
        articles: this.normalizer.normalizeDevTo(articles),
        failed: false,
      })),
      catchError(() => of<SourceFetchOutcome>({ source: 'devto', articles: [], failed: true })),
    );

    const msLearn$ = this.msLearnFetcher.fetchArticles().pipe(
      map((entries): SourceFetchOutcome => ({
        source: 'mslearn',
        articles: this.normalizer.normalizeMsLearn(entries),
        failed: false,
      })),
      catchError(() => of<SourceFetchOutcome>({ source: 'mslearn', articles: [], failed: true })),
    );

    const hackerNews$ = this.hackerNewsFetcher.fetchArticles().pipe(
      map((hits): SourceFetchOutcome => ({
        source: 'hackernews',
        articles: this.normalizer.normalizeHackerNews(hits),
        failed: false,
      })),
      catchError(() =>
        of<SourceFetchOutcome>({ source: 'hackernews', articles: [], failed: true }),
      ),
    );

    const hashnode$ = this.hashnodeFetcher.fetchArticles().pipe(
      map((posts): SourceFetchOutcome => ({
        source: 'hashnode',
        articles: this.normalizer.normalizeHashnode(posts),
        failed: false,
      })),
      catchError(() => of<SourceFetchOutcome>({ source: 'hashnode', articles: [], failed: true })),
    );

    const gitHub$ = this.gitHubFetcher.fetchArticles().pipe(
      map((repos): SourceFetchOutcome => ({
        source: 'github',
        articles: this.normalizer.normalizeGitHub(repos),
        failed: false,
      })),
      catchError(() => of<SourceFetchOutcome>({ source: 'github', articles: [], failed: true })),
    );

    return forkJoin([devTo$, msLearn$, hackerNews$, hashnode$, gitHub$]).pipe(
      map((outcomes) => this.mergeOutcomes(outcomes)),
    );
  }

  private mergeOutcomes(outcomes: SourceFetchOutcome[]): NewsFeedResult {
    const articles = outcomes
      .flatMap((outcome) => outcome.articles)
      .sort((a, b) => this.comparePublishedAt(a.publishedAt, b.publishedAt));

    const failedSources = outcomes
      .filter((outcome) => outcome.failed)
      .map((outcome) => outcome.source);

    return { articles, failedSources };
  }

  private comparePublishedAt(a: string | null, b: string | null): number {
    if (a === null && b === null) return 0;
    if (a === null) return 1;
    if (b === null) return -1;
    return new Date(b).getTime() - new Date(a).getTime();
  }
}
