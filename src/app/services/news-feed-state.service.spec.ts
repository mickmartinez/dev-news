import { TestBed } from '@angular/core/testing';
import { Subject, of } from 'rxjs';
import { ArticleSource, UnifiedArticle } from '../models/article.model';
import { NewsFeedResult, NewsAggregatorService } from './news-aggregator.service';
import { NewsFeedStateService } from './news-feed-state.service';

const article = (id: string, source: ArticleSource, tags: string[] = []): UnifiedArticle => ({
  id,
  source,
  title: `${source} article`,
  url: `https://example.test/${id}`,
  summary: null,
  author: null,
  publishedAt: null,
  tags,
  thumbnailUrl: null,
  metric: null,
});

describe('NewsFeedStateService', () => {
  let service: NewsFeedStateService;
  let fetchFeed: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchFeed = vi.fn(() => of<NewsFeedResult>({ articles: [], failedSources: [] }));
    TestBed.configureTestingModule({
      providers: [NewsFeedStateService, { provide: NewsAggregatorService, useValue: { fetchFeed } }],
    });
    service = TestBed.inject(NewsFeedStateService);
  });

  it('GivenPendingFeed_WhenLoadFeedCalled_ThenStatusTransitionsFromLoadingToLoaded', () => {
    // Arrange
    const response = new Subject<NewsFeedResult>();
    fetchFeed.mockReturnValue(response);

    // Act
    service.loadFeed();

    // Assert
    expect(service.status()).toBe('loading');
    response.next({ articles: [article('devto-1', 'devto')], failedSources: [] });
    response.complete();
    expect(service.status()).toBe('loaded');
  });

  it('GivenFullFailure_WhenRetryCalled_ThenFetchesFreshResultsAndClearsFailureState', () => {
    // Arrange
    fetchFeed
      .mockReturnValueOnce(of<NewsFeedResult>({ articles: [], failedSources: [...service.availableSources] }))
      .mockReturnValueOnce(of<NewsFeedResult>({ articles: [article('github-1', 'github')], failedSources: [] }));
    service.loadFeed();

    // Act
    service.retry();

    // Assert
    expect(fetchFeed).toHaveBeenCalledTimes(2);
    expect(service.articles()).toEqual([article('github-1', 'github')]);
    expect(service.isFullFailure()).toBe(false);
  });

  it('GivenPartialFailure_WhenFeedSettles_ThenExposesResultsAndPartialFailure', () => {
    // Arrange
    fetchFeed.mockReturnValue(
      of<NewsFeedResult>({ articles: [article('devto-1', 'devto')], failedSources: ['hashnode'] }),
    );

    // Act
    service.loadFeed();

    // Assert
    expect(service.articles()).toEqual([article('devto-1', 'devto')]);
    expect(service.failedSources()).toEqual(['hashnode']);
    expect(service.isPartialFailure()).toBe(true);
  });

  it('GivenAllSourcesFail_WhenFeedSettles_ThenReportsFullFailureWithNoArticles', () => {
    // Arrange
    fetchFeed.mockReturnValue(of<NewsFeedResult>({ articles: [], failedSources: [...service.availableSources] }));

    // Act
    service.loadFeed();

    // Assert
    expect(service.articles()).toEqual([]);
    expect(service.isFullFailure()).toBe(true);
    expect(service.isPartialFailure()).toBe(false);
  });

  it('GivenSourceAndTagSelections_WhenFiltersToggled_ThenArticlesMatchBothDimensions', () => {
    // Arrange
    fetchFeed.mockReturnValue(
      of<NewsFeedResult>({
        articles: [
          article('devto-angular', 'devto', ['angular']),
          article('devto-react', 'devto', ['react']),
          article('github-angular', 'github', ['angular']),
        ],
        failedSources: [],
      }),
    );
    service.loadFeed();

    // Act
    service.toggleSourceFilter('devto');
    service.toggleTagFilter('angular');

    // Assert
    expect(service.filteredArticles().map((item) => item.id)).toEqual(['devto-angular']);
  });

  it('GivenActiveFilters_WhenClearFiltersCalled_ThenSelectionsAreEmptyAndAllArticlesReturn', () => {
    // Arrange
    service.toggleSourceFilter('github');
    service.toggleTagFilter('angular');

    // Act
    service.clearFilters();

    // Assert
    expect(service.selectedSources()).toEqual([]);
    expect(service.selectedTags()).toEqual([]);
  });
});