import { UnifiedArticle } from './article.model';

/** Dexie table row: a UnifiedArticle wrapped with a local-only favorited timestamp. */
export interface FavoriteRecord extends UnifiedArticle {
  /** ISO 8601 timestamp set when the article was favorited; used to sort the Favorites view. */
  favoritedAt: string;
}

/** Identifies which FavoritesStoreService operation produced a FavoritesStoreError. */
export type FavoritesErrorOperation = 'add' | 'remove' | 'load';

/** Error contract surfaced by FavoritesStoreService for a failed store operation. */
export interface FavoritesStoreError {
  operation: FavoritesErrorOperation;
  /** null only for bulk 'load' failures; otherwise the affected article id. */
  articleId: string | null;
  /** User-safe message, safe to render directly in the UI. */
  message: string;
  /** Original thrown value, for logging only — never rendered. */
  cause: unknown;
}
