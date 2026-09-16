import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { FavoriteRecord, FavoritesStoreError } from '../../models/favorite.model';
import { FavoritesStoreService } from '../../services/favorites-store.service';
import { FavoritesViewComponent } from './favorites-view.component';

describe('FavoritesViewComponent', () => {
  let fixture: ComponentFixture<FavoritesViewComponent>;
  const favorites = signal<FavoriteRecord[]>([]);
  const isLoading = signal(false);
  const lastError = signal<FavoritesStoreError | null>(null);
  const store = {
    favorites: favorites.asReadonly(), isLoading: isLoading.asReadonly(), lastError: lastError.asReadonly(),
    remove: vi.fn(), clearError: vi.fn(),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FavoritesViewComponent],
      providers: [{ provide: FavoritesStoreService, useValue: store }],
    }).compileComponents();
    fixture = TestBed.createComponent(FavoritesViewComponent);
  });

  it('GivenNoFavorites_WhenRendered_ThenEmptyStateIsShown', () => {
    // Arrange
    favorites.set([]);

    // Act
    fixture.detectChanges();

    // Assert
    expect(fixture.nativeElement.querySelector('[data-testid="favorites-empty-state"]')).toBeTruthy();
  });

  it('GivenStoreError_WhenRendered_ThenDisplaysMessageInLiveRegion', () => {
    // Arrange
    lastError.set({ operation: 'remove', articleId: 'devto-1', message: 'Unable to remove.', cause: null });

    // Act
    fixture.detectChanges();

    // Assert
    const banner = fixture.nativeElement.querySelector('[data-testid="favorites-error"]');
    expect(banner?.getAttribute('aria-live')).toBe('polite');
    expect(banner?.textContent).toContain('Unable to remove.');
  });
});