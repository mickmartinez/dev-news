import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UnifiedArticle } from '../../../models/article.model';
import { ArticleCardComponent } from './article-card.component';

const article: UnifiedArticle = {
  id: 'hashnode-1', source: 'hashnode', title: 'Useful article', url: 'https://example.test',
  summary: 'Summary', author: null, publishedAt: null, tags: [], thumbnailUrl: null, metric: null,
};

describe('ArticleCardComponent', () => {
  let fixture: ComponentFixture<ArticleCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ArticleCardComponent] }).compileComponents();
    fixture = TestBed.createComponent(ArticleCardComponent);
    fixture.componentRef.setInput('article', article);
  });

  it('GivenArticle_WhenRendered_ThenShowsItsTitleAndSource', () => {
    // Arrange
    // Act
    fixture.detectChanges();

    // Assert
    expect(fixture.nativeElement.textContent).toContain('Useful article');
    expect(fixture.nativeElement.querySelector('[data-testid="source-badge"]')?.textContent).toContain('Hashnode');
  });

  it('GivenNullMetricAndDate_WhenRendered_ThenMetricAndDateAreOmitted', () => {
    // Arrange
    // Act
    fixture.detectChanges();

    // Assert
    expect(fixture.nativeElement.querySelector('[data-testid="article-metric"]')).toBeNull();
    expect(fixture.nativeElement.querySelector('[data-testid="published-date"]')).toBeNull();
    expect(fixture.nativeElement.textContent).not.toContain('Invalid Date');
  });

  it('GivenFavoriteArticle_WhenToggleClicked_ThenEmitsArticleAndPressedStateIsAccessible', () => {
    // Arrange
    const emitted: UnifiedArticle[] = [];
    fixture.componentRef.setInput('isFavorite', true);
    fixture.componentInstance.favoriteToggled.subscribe((value) => emitted.push(value));

    // Act
    fixture.detectChanges();
    (fixture.nativeElement as HTMLElement)
      .querySelector<HTMLButtonElement>('[data-testid="favorite-toggle"]')
      ?.click();

    // Assert
    const button = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>(
      '[data-testid="favorite-toggle"]',
    );
    expect(button?.getAttribute('aria-pressed')).toBe('true');
    expect(button?.getAttribute('aria-label')).toContain('Remove');
    expect(emitted).toEqual([article]);
  });
});