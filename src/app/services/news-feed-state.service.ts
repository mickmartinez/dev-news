import { DestroyRef, Injectable, Signal, computed, inject, signal } from '@angular/core';
import { Subscription } from 'rxjs';
import { ArticleSource, UnifiedArticle } from '../models/article.model';
import { DEVNEWS_TAGS, GITHUB_TAGS, MSLEARN_TAGS } from '../data/topic-tags';
import { FeedLoadStatus } from '../models/feed-filter-state.model';
import { NewsAggregatorService } from './news-aggregator.service';

@Injectable({ providedIn: 'root' })
export class NewsFeedStateService {
  private readonly aggregator = inject(NewsAggregatorService);
  private readonly destroyRef = inject(DestroyRef);
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
  private activeLoad?: Subscription;

  readonly isFullFailure: Signal<boolean> = computed(
    () => this.failedSourceState().length === this.availableSources.length,
  );
  readonly isPartialFailure: Signal<boolean> = computed(() => {
    const failedCount = this.failedSourceState().length;
    return failedCount > 0 && failedCount < this.availableSources.length;
  });
  /** No selectable source is currently untaggable — reserved for sources whose normalizer can't yet derive real DEVNEWS_TAGS topic tags. */
  private static readonly UNTAGGABLE_SOURCES: ReadonlySet<ArticleSource> = new Set();
  readonly isTagFilteringDisabled: Signal<boolean> = computed(() => {
    const sources = this.selectedSourceState();
    return sources.length > 0 && sources.every((source) => NewsFeedStateService.UNTAGGABLE_SOURCES.has(source));
  });
  readonly filteredArticles: Signal<UnifiedArticle[]> = computed(() => {
    const sources = this.selectedSourceState();
    const tags = this.selectedTagState();
    const tagFilteringDisabled = this.isTagFilteringDisabled();
    return this.articleState().filter(
      (article) =>
        (sources.length === 0 || sources.includes(article.source)) &&
        (tagFilteringDisabled ||
          tags.length === 0 ||
          tags.some((tag) => article.tags.includes(tag.toLowerCase()))),
    );
  });
  readonly availableSources: readonly ArticleSource[] = [
    'devto',
    'mslearn',
    'hackernews',
    'github',
  ];
  private static readonly SOURCE_TAG_SETS: Record<ArticleSource, readonly string[]> = {
    devto: DEVNEWS_TAGS,
    hackernews: DEVNEWS_TAGS,
    mslearn: MSLEARN_TAGS,
    github: GITHUB_TAGS,
  };
  readonly availableTags: Signal<string[]> = computed(() => {
    const selectedSources = this.selectedSourceState();
    const sourcesToUse =
      selectedSources.length === 0
        ? this.availableSources
        : this.availableSources.filter((source) => selectedSources.includes(source));
    const seen = new Set<string>();
    const result: string[] = [];
    for (const source of sourcesToUse) {
      for (const tag of NewsFeedStateService.SOURCE_TAG_SETS[source] ?? []) {
        const normalized = tag.toLowerCase();
        if (!seen.has(normalized)) {
          seen.add(normalized);
          result.push(normalized);
        }
      }
    }
    return result;
  });

  constructor() {
    this.destroyRef.onDestroy(() => this.activeLoad?.unsubscribe());
  }

  loadFeed(): void {
    this.activeLoad?.unsubscribe();
    this.statusState.set('loading');
    this.failedSourceState.set([]);
    this.activeLoad = this.aggregator.fetchFeed().subscribe({
      next: (result) => {
        this.articleState.set(result.articles);
        this.failedSourceState.set(result.failedSources);
      },
      error: () => {
        this.articleState.set([]);
        this.failedSourceState.set([...this.availableSources]);
        this.statusState.set('loaded');
      },
      complete: () => this.statusState.set('loaded'),
    });
  }

  retry(): void {
    this.loadFeed();
  }

  toggleSourceFilter(source: ArticleSource): void {
    this.selectedSourceState.update((sources) =>
      sources.includes(source) ? sources.filter((item) => item !== source) : [...sources, source],
    );
    this.pruneOutOfScopeTags();
  }

  private pruneOutOfScopeTags(): void {
    const stillAvailable = new Set(this.availableTags());
    this.selectedTagState.update((tags) => tags.filter((tag) => stillAvailable.has(tag)));
  }

  toggleTagFilter(tag: string): void {
    const normalizedTag = tag.toLowerCase();
    this.selectedTagState.update((tags) =>
      tags.includes(normalizedTag) ? tags.filter((item) => item !== normalizedTag) : [...tags, normalizedTag],
    );
  }

  clearFilters(): void {
    this.selectedSourceState.set([]);
    this.selectedTagState.set([]);
  }
}