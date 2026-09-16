import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { ArticleSource, UnifiedArticle } from '../../models/article.model';
import { FavoritesStoreService } from '../../services/favorites-store.service';
import { NewsFeedStateService } from '../../services/news-feed-state.service';
import { ArticleCardComponent } from './article-card/article-card.component';
import { FeedFiltersComponent } from './feed-filters/feed-filters.component';

@Component({
  selector: 'app-news-feed',
  imports: [ArticleCardComponent, FeedFiltersComponent],
  templateUrl: './news-feed.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NewsFeedComponent implements OnInit {
  readonly state = inject(NewsFeedStateService);
  private readonly favoritesStore = inject(FavoritesStoreService, { optional: true });
  readonly feedError = signal<string | null>(null);
  readonly availableSources: ArticleSource[] = [...(this.state.availableSources ?? [])];
  readonly availableTags: string[] = [...(this.state.availableTags ?? [])];

  ngOnInit(): void {
    this.state.loadFeed();
  }

  retry(): void {
    this.state.retry();
  }

  isFavorite(id: string): boolean {
    return this.favoritesStore?.isFavorite(id) ?? false;
  }

  get selectedSources(): ArticleSource[] {
    return (this.state as unknown as { selectedSources?: () => ArticleSource[] }).selectedSources?.() ?? [];
  }

  get selectedTags(): string[] {
    return (this.state as unknown as { selectedTags?: () => string[] }).selectedTags?.() ?? [];
  }

  toggleFavorite(article: UnifiedArticle): void {
    const operation = this.isFavorite(article.id)
      ? this.favoritesStore?.remove(article.id)
      : this.favoritesStore?.add(article);
    void Promise.resolve(operation).catch((error: { message?: string }) => {
      this.feedError.set(error.message ?? 'Unable to update Favorites. Please try again.');
    });
  }
}