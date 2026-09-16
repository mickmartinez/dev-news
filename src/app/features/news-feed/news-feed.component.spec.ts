import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { UnifiedArticle } from '../../models/article.model';
import { NewsFeedStateService } from '../../services/news-feed-state.service';
import { NewsFeedComponent } from './news-feed.component';

const article: UnifiedArticle = {
  id: 'devto-1', source: 'devto', title: 'A title', url: 'https://example.test', summary: null,
  author: null, publishedAt: null, tags: [], thumbnailUrl: null, metric: null,
};

describe('NewsFeedComponent', () => {
  let fixture: ComponentFixture<NewsFeedComponent>;
  const status = signal<'idle' | 'loading' | 'loaded'>('idle');
  const isFullFailure = signal(false);
  const isPartialFailure = signal(false);
  const filteredArticles = signal<UnifiedArticle[]>([]);
  const state = {
    status: status.asReadonly(),
    isFullFailure: isFullFailure.asReadonly(),
    isPartialFailure: isPartialFailure.asReadonly(),
    filteredArticles: filteredArticles.asReadonly(),
    failedSources: signal([]).asReadonly(),
    loadFeed: vi.fn(), retry: vi.fn(), clearFilters: vi.fn(),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NewsFeedComponent],
      providers: [{ provide: NewsFeedStateService, useValue: state }],
    }).compileComponents();
    fixture = TestBed.createComponent(NewsFeedComponent);
  });

  it('GivenLoadingStatus_WhenRendered_ThenLoadingIndicatorIsShown', () => {
    // Arrange
    status.set('loading');

    // Act
    fixture.detectChanges();

    // Assert
    expect(fixture.nativeElement.querySelector('[data-testid="loading-indicator"]')).toBeTruthy();
  });

  it('GivenFullFailure_WhenRendered_ThenRetryActionIsShownAndInvokesStateRetry', () => {
    // Arrange
    status.set('loaded');
    isFullFailure.set(true);

    // Act
    fixture.detectChanges();
    (fixture.nativeElement as HTMLElement)
      .querySelector<HTMLButtonElement>('[data-testid="retry-button"]')
      ?.click();

    // Assert
    expect(fixture.nativeElement.querySelector('[data-testid="full-feed-error"]')).toBeTruthy();
    expect(state.retry).toHaveBeenCalledOnce();
  });

  it('GivenPartialFailureWithResults_WhenRendered_ThenBannerAndArticleListAreBothShown', () => {
    // Arrange
    status.set('loaded');
    isPartialFailure.set(true);
    filteredArticles.set([article]);

    // Act
    fixture.detectChanges();

    // Assert
    expect(fixture.nativeElement.querySelector('[data-testid="partial-failure-banner"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('[data-testid="article-list"]')).toBeTruthy();
  });
});