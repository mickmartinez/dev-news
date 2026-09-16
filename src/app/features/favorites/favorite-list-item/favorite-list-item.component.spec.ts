import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FavoriteRecord } from '../../../models/favorite.model';
import { FavoriteListItemComponent } from './favorite-list-item.component';

const favorite: FavoriteRecord = {
  id: 'github-1', source: 'github', title: 'Repository', url: 'https://example.test', summary: null,
  author: null, publishedAt: null, tags: [], thumbnailUrl: null, metric: null,
  favoritedAt: '2026-09-16T00:00:00.000Z',
};

describe('FavoriteListItemComponent', () => {
  let fixture: ComponentFixture<FavoriteListItemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [FavoriteListItemComponent] }).compileComponents();
    fixture = TestBed.createComponent(FavoriteListItemComponent);
    fixture.componentRef.setInput('favorite', favorite);
  });

  it('GivenFavorite_WhenRemoveClicked_ThenEmitsFavoriteId', () => {
    // Arrange
    const removed: string[] = [];
    fixture.componentInstance.remove.subscribe((id) => removed.push(id));

    // Act
    fixture.detectChanges();
    (fixture.nativeElement as HTMLElement)
      .querySelector<HTMLButtonElement>('[data-testid="remove-favorite"]')
      ?.click();

    // Assert
    expect(removed).toEqual(['github-1']);
  });
});