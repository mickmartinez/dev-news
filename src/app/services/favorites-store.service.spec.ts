import { IDBKeyRange, IDBFactory } from 'fake-indexeddb';
import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import Dexie from 'dexie';
import { ArticleSource, UnifiedArticle } from '../models/article.model';
import { FavoritesDatabase, FavoritesStoreService } from './favorites-store.service';

// Dexie caches its DOM dependencies on first module load, which may happen before this file's
// imports run (e.g. another spec file importing this service in the same worker). Assigning
// fresh instances here — rather than relying on `fake-indexeddb/auto`'s import-order side effect
// — mutates Dexie's shared `dependencies` object directly, so it takes effect regardless of order.
Dexie.dependencies.indexedDB = new IDBFactory();
Dexie.dependencies.IDBKeyRange = IDBKeyRange;

const article = (id: string, source: ArticleSource = 'devto'): UnifiedArticle => ({
  id,
  source,
  title: `${source} article ${id}`,
  url: `https://example.test/${id}`,
  summary: null,
  author: null,
  publishedAt: null,
  tags: [],
  thumbnailUrl: null,
  metric: null,
});

const flush = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

// liveQuery emissions land asynchronously, so signal-backed assertions must poll until settled.
const waitUntil = async (predicate: () => boolean, maxAttempts = 50): Promise<void> => {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    if (predicate()) {
      return;
    }
    await flush();
  }
};

describe('FavoritesStoreService', () => {
  let service: FavoritesStoreService;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'browser' }],
    });
    service = TestBed.inject(FavoritesStoreService);
    await waitUntil(() => !service.isLoading());
  });

  afterEach(async () => {
    // Rows persist in fake-indexeddb across tests within this file, so wipe them explicitly.
    const cleanupDb = new FavoritesDatabase();
    await cleanupDb.favorites.clear();
    cleanupDb.close();
  });

  it('GivenNoExistingFavorite_WhenAddCalled_ThenFavoritesAndFavoriteIdsReflectItWithFavoritedAtSet', async () => {
    // Arrange
    const toAdd = article('devto-1');

    // Act
    await service.add(toAdd);
    await waitUntil(() => service.favorites().length === 1);

    // Assert
    expect(service.favorites()).toHaveLength(1);
    expect(service.favorites()[0].id).toBe('devto-1');
    expect(typeof service.favorites()[0].favoritedAt).toBe('string');
    expect(service.favoriteIds().has('devto-1')).toBe(true);
  });

  it('GivenArticleAlreadyFavorited_WhenAddCalledAgain_ThenItIsANoOpAndOriginalFavoritedAtIsPreserved', async () => {
    // Arrange
    const toAdd = article('devto-2');
    await service.add(toAdd);
    await waitUntil(() => service.favorites().length === 1);
    const originalFavoritedAt = service.favorites()[0].favoritedAt;

    // Act
    await service.add(toAdd);
    await flush();

    // Assert
    expect(service.favorites()).toHaveLength(1);
    expect(service.favorites()[0].favoritedAt).toBe(originalFavoritedAt);
  });

  it('GivenExistingFavorite_WhenRemoveCalled_ThenItDisappearsFromFavoritesAndFavoriteIds', async () => {
    // Arrange
    const toAdd = article('devto-3');
    await service.add(toAdd);
    await waitUntil(() => service.favorites().length === 1);

    // Act
    await service.remove('devto-3');
    await waitUntil(() => service.favorites().length === 0);

    // Assert
    expect(service.favorites()).toEqual([]);
    expect(service.favoriteIds().has('devto-3')).toBe(false);
  });

  it('GivenNonFavoritedId_WhenRemoveCalled_ThenItIsANoOpThatDoesNotThrow', async () => {
    // Act & Assert
    await expect(service.remove('does-not-exist')).resolves.toBeUndefined();
    expect(service.favorites()).toEqual([]);
  });

  it('GivenArticleState_WhenIsFavoriteCalled_ThenReflectsCurrentFavoritedStatus', async () => {
    // Arrange
    const toAdd = article('devto-4');
    expect(service.isFavorite('devto-4')).toBe(false);

    // Act
    await service.add(toAdd);
    await waitUntil(() => service.isFavorite('devto-4'));

    // Assert
    expect(service.isFavorite('devto-4')).toBe(true);

    // Act
    await service.remove('devto-4');
    await waitUntil(() => !service.isFavorite('devto-4'));

    // Assert
    expect(service.isFavorite('devto-4')).toBe(false);
  });

  it('GivenMultipleFavorites_WhenFavoritesRead_ThenSortedByFavoritedAtDescending', async () => {
    // Arrange
    const isoSpy = vi.spyOn(Date.prototype, 'toISOString');
    isoSpy.mockReturnValueOnce('2026-01-01T00:00:00.000Z');
    await service.add(article('devto-older'));
    await waitUntil(() => service.favorites().length === 1);

    isoSpy.mockReturnValueOnce('2026-01-02T00:00:00.000Z');
    await service.add(article('devto-newer'));
    await waitUntil(() => service.favorites().length === 2);
    isoSpy.mockRestore();

    // Assert
    expect(service.favorites().map((favorite) => favorite.id)).toEqual([
      'devto-newer',
      'devto-older',
    ]);
  });

  it('GivenAddFailsBecauseArticleIdIsMissing_WhenAddCalled_ThenLastErrorIsSetWithAddOperation', async () => {
    // Arrange
    const invalidArticle = { ...article('devto-invalid'), id: undefined } as unknown as UnifiedArticle;

    // Act & Assert
    await expect(service.add(invalidArticle)).rejects.toBeTruthy();
    expect(service.lastError()?.operation).toBe('add');
  });

  it('GivenPriorErrorRecorded_WhenSubsequentAddSucceeds_ThenLastErrorIsClearedToNull', async () => {
    // Arrange
    const invalidArticle = { ...article('devto-invalid-2'), id: undefined } as unknown as UnifiedArticle;
    await expect(service.add(invalidArticle)).rejects.toBeTruthy();
    expect(service.lastError()).not.toBeNull();

    // Act
    await service.add(article('devto-5'));
    await waitUntil(() => service.lastError() === null);

    // Assert
    expect(service.lastError()).toBeNull();
  });

  it('GivenLastErrorIsSet_WhenClearErrorCalled_ThenLastErrorResetsToNull', async () => {
    // Arrange
    const invalidArticle = { ...article('devto-invalid-3'), id: undefined } as unknown as UnifiedArticle;
    await expect(service.add(invalidArticle)).rejects.toBeTruthy();
    expect(service.lastError()).not.toBeNull();

    // Act
    service.clearError();

    // Assert
    expect(service.lastError()).toBeNull();
  });
});
