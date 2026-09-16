import { Injectable, Signal, computed, inject, signal } from '@angular/core';
import { ArticleSource, UnifiedArticle } from '../models/article.model';
import { FeedLoadStatus } from '../models/feed-filter-state.model';
import { NewsAggregatorService } from './news-aggregator.service';

@Injectable({ providedIn: 'root' })
export class NewsFeedStateService {
  private readonly aggregator = inject(NewsAggregatorService);
  private readonly articleState = signal<UnifiedArticle[]>([]);
  private readonly statusState = signal<FeedLoadStatus>('idle');
  private readonly failedSourceState = signal<ArticleSource[]>([]);
  private readonly selectedSourceState = signal<ArticleSource[]>([]);
  private readonly selectedTagState = signal<string[]>([]);

  readonly articles = this.articleState.asReadonly();
  readonly status = this.statusState.asReadonly();
  readonly failedSources = this.failedSourceState.asReadonly();
  readonly selectedSources = this.selectedSourceState.asReadonly();
  readonly selectedTags = this.selectedTagState.asReadonly();
  readonly isFullFailure: Signal<boolean> = computed(() => false);
  readonly isPartialFailure: Signal<boolean> = computed(() => false);
  readonly filteredArticles: Signal<UnifiedArticle[]> = computed(() => []);
  readonly availableSources: readonly ArticleSource[] = [
    'devto',
    'mslearn',
    'hackernews',
    'hashnode',
    'github',
  ];
  readonly availableTags: readonly string[] = [];

  loadFeed(): void {
    throw new Error('Not implemented: loadFeed');
  }

  retry(): void {
    throw new Error('Not implemented: retry');
  }

  toggleSourceFilter(source: ArticleSource): void {
    throw new Error('Not implemented: toggleSourceFilter');
  }

  toggleTagFilter(tag: string): void {
    throw new Error('Not implemented: toggleTagFilter');
  }

  clearFilters(): void {
    throw new Error('Not implemented: clearFilters');
  }
}