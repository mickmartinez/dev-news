import { Injectable, computed, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import Dexie, { Table, liveQuery } from 'dexie';
import { catchError, of } from 'rxjs';
import { UnifiedArticle } from '../models/article.model';
import { FavoriteRecord, FavoritesStoreError } from '../models/favorite.model';

/** Dexie subclass encapsulating the Favorites schema/versioning. */
export class FavoritesDatabase extends Dexie {
  favorites!: Table<FavoriteRecord, string>;

  constructor() {
    super('dev-news-favorites');
    this.version(1).stores({
      favorites: 'id, favoritedAt',
    });
  }
}

@Injectable({ providedIn: 'root' })
export class FavoritesStoreService {
  private readonly db = new FavoritesDatabase();

  private readonly _lastError = signal<FavoritesStoreError | null>(null);
  readonly lastError = this._lastError.asReadonly();

  // Bridges the live Dexie query to a signal; undefined until the first emission resolves.
  private readonly _liveFavorites = toSignal(
    liveQuery(() => this.db.favorites.orderBy('favoritedAt').reverse().toArray()).pipe(
      catchError((cause) => {
        this._lastError.set({
          operation: 'load',
          articleId: null,
          message: 'Unable to load favorites from local storage.',
          cause,
        });
        return of<FavoriteRecord[]>([]);
      }),
    ),
  );

  readonly favorites = computed<FavoriteRecord[]>(() => this._liveFavorites() ?? []);
  readonly isLoading = computed(() => this._liveFavorites() === undefined);
  readonly favoriteIds = computed<ReadonlySet<string>>(
    () => new Set(this.favorites().map((favorite) => favorite.id)),
  );

  isFavorite(id: string): boolean {
    return this.favoriteIds().has(id);
  }

  async add(article: UnifiedArticle): Promise<void> {
    try {
      const existing = await this.db.favorites.get(article.id);
      if (existing) {
        return;
      }
      const record: FavoriteRecord = { ...article, favoritedAt: new Date().toISOString() };
      await this.db.favorites.put(record);
    } catch (cause) {
      const error: FavoritesStoreError = {
        operation: 'add',
        articleId: article.id,
        message: 'Unable to save this article to Favorites. Please try again.',
        cause,
      };
      this._lastError.set(error);
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    try {
      // Dexie's delete() on a missing key resolves without throwing, making this a natural no-op.
      await this.db.favorites.delete(id);
    } catch (cause) {
      const error: FavoritesStoreError = {
        operation: 'remove',
        articleId: id,
        message: 'Unable to remove this article from Favorites. Please try again.',
        cause,
      };
      this._lastError.set(error);
      throw error;
    }
  }

  clearError(): void {
    this._lastError.set(null);
  }
}
