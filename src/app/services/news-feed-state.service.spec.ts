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

  it('GivenNoSourcesSelected_WhenIsTagFilteringDisabledRead_ThenFalse', () => {
    // Arrange
    // (no sources selected by default)

    // Act
    const disabled = service.isTagFilteringDisabled();

    // Assert
    expect(disabled).toBe(false);
  });

  it('GivenSingleNonHackerNewsSourceSelected_WhenIsTagFilteringDisabledRead_ThenFalse', () => {
    // Arrange
    service.toggleSourceFilter('devto');

    // Act
    const disabled = service.isTagFilteringDisabled();

    // Assert
    expect(disabled).toBe(false);
  });

  it('GivenHackerNewsPlusAnotherSourceSelected_WhenIsTagFilteringDisabledRead_ThenFalse', () => {
    // Arrange
    service.toggleSourceFilter('hackernews');
    service.toggleSourceFilter('devto');

    // Act
    const disabled = service.isTagFilteringDisabled();

    // Assert
    expect(disabled).toBe(false);
  });

  it('GivenOnlyHackerNewsSelected_WhenIsTagFilteringDisabledRead_ThenTrue', () => {
    // Arrange
    service.toggleSourceFilter('hackernews');

    // Act
    const disabled = service.isTagFilteringDisabled();

    // Assert
    expect(disabled).toBe(true);
  });

  it('GivenOnlyMsLearnSelected_WhenIsTagFilteringDisabledRead_ThenTrue', () => {
    // Arrange
    service.toggleSourceFilter('mslearn');

    // Act
    const disabled = service.isTagFilteringDisabled();

    // Assert
    expect(disabled).toBe(true);
  });

  it('GivenMsLearnPlusAnotherSourceSelected_WhenIsTagFilteringDisabledRead_ThenFalse', () => {
    // Arrange
    service.toggleSourceFilter('mslearn');
    service.toggleSourceFilter('devto');

    // Act
    const disabled = service.isTagFilteringDisabled();

    // Assert
    expect(disabled).toBe(false);
  });

  it('GivenHackerNewsAndMsLearnBothSelectedAndNothingElse_WhenIsTagFilteringDisabledRead_ThenTrue', () => {
    // Arrange
    service.toggleSourceFilter('hackernews');
    service.toggleSourceFilter('mslearn');

    // Act
    const disabled = service.isTagFilteringDisabled();

    // Assert
    expect(disabled).toBe(true);
  });

  it('GivenOnlyHackerNewsSelectedAndTagsSelected_WhenFilteredArticlesRead_ThenTagCriteriaIsIgnoredAndMatchingHackerNewsArticlesAreReturned', () => {
    // Arrange
    fetchFeed.mockReturnValue(
      of<NewsFeedResult>({
        articles: [
          article('hn-1', 'hackernews', ['story', 'ask_hn']),
          article('hn-2', 'hackernews', ['story', 'author_jdoe']),
        ],
        failedSources: [],
      }),
    );
    service.loadFeed();
    service.toggleSourceFilter('hackernews');
    service.toggleTagFilter('angular');

    // Act
    const result = service.filteredArticles();

    // Assert
    expect(result.map((item) => item.id)).toEqual(['hn-1', 'hn-2']);
  });

  it('GivenOnlyMsLearnSelectedAndTagsSelected_WhenFilteredArticlesRead_ThenTagCriteriaIsIgnoredAndMsLearnArticlesAreReturned', () => {
    // Arrange
    fetchFeed.mockReturnValue(
      of<NewsFeedResult>({
        articles: [article('ms-1', 'mslearn', []), article('ms-2', 'mslearn', [])],
        failedSources: [],
      }),
    );
    service.loadFeed();
    service.toggleSourceFilter('mslearn');
    service.toggleTagFilter('angular');

    // Act
    const result = service.filteredArticles();

    // Assert
    expect(result.map((item) => item.id)).toEqual(['ms-1', 'ms-2']);
  });

  it('GivenOnlyHackerNewsSelectedWithNoTagsSelected_WhenFilteredArticlesRead_ThenOnlySourceFilterAppliesAndResultIsNotForcedEmpty', () => {
    // Arrange
    fetchFeed.mockReturnValue(
      of<NewsFeedResult>({
        articles: [article('hn-1', 'hackernews', ['story']), article('devto-1', 'devto', ['angular'])],
        failedSources: [],
      }),
    );
    service.loadFeed();
    service.toggleSourceFilter('hackernews');

    // Act
    const result = service.filteredArticles();

    // Assert
    expect(result.map((item) => item.id)).toEqual(['hn-1']);
  });

  it('GivenOnlyHackerNewsSelectedAndTagsSelected_WhenIsTagFilteringDisabledBecomesTrue_ThenSelectedTagsSignalRemainsUnchanged', () => {
    // Arrange
    service.toggleTagFilter('angular');

    // Act
    service.toggleSourceFilter('hackernews');

    // Assert
    expect(service.isTagFilteringDisabled()).toBe(true);
    expect(service.selectedTags()).toEqual(['angular']);
  });

  it('GivenOnlyHackerNewsSelectedAndTagsSelected_WhenAnotherSourceIsAlsoSelected_ThenFilteredArticlesReapplyThePreviouslySelectedTags', () => {
    // Arrange
    fetchFeed.mockReturnValue(
      of<NewsFeedResult>({
        articles: [
          article('hn-1', 'hackernews', ['story']),
          article('devto-angular', 'devto', ['angular']),
          article('devto-react', 'devto', ['react']),
        ],
        failedSources: [],
      }),
    );
    service.loadFeed();
    service.toggleSourceFilter('hackernews');
    service.toggleTagFilter('angular');
    expect(service.isTagFilteringDisabled()).toBe(true);

    // Act
    service.toggleSourceFilter('devto');

    // Assert
    expect(service.isTagFilteringDisabled()).toBe(false);
    expect(service.filteredArticles().map((item) => item.id)).toEqual(['devto-angular']);
  });

  it('GivenOnlyHackerNewsSelectedAndTagsSelected_WhenHackerNewsIsDeselectedLeavingZeroSources_ThenFilteredArticlesReapplyThePreviouslySelectedTagsAcrossAllSources', () => {
    // Arrange
    fetchFeed.mockReturnValue(
      of<NewsFeedResult>({
        articles: [
          article('hn-1', 'hackernews', ['story']),
          article('devto-angular', 'devto', ['angular']),
          article('devto-react', 'devto', ['react']),
        ],
        failedSources: [],
      }),
    );
    service.loadFeed();
    service.toggleSourceFilter('hackernews');
    service.toggleTagFilter('angular');
    expect(service.isTagFilteringDisabled()).toBe(true);

    // Act
    service.toggleSourceFilter('hackernews');

    // Assert
    expect(service.isTagFilteringDisabled()).toBe(false);
    expect(service.filteredArticles().map((item) => item.id)).toEqual(['devto-angular']);
  });

  it('GivenSourcesChangeFromAllToHackerNewsOnly_WhenIsTagFilteringDisabledRead_ThenItRecomputesImmediatelyWithoutAdditionalAction', () => {
    // Arrange
    for (const source of service.availableSources) {
      service.toggleSourceFilter(source);
    }
    expect(service.isTagFilteringDisabled()).toBe(false);

    // Act
    for (const source of service.availableSources) {
      if (source !== 'hackernews') {
        service.toggleSourceFilter(source);
      }
    }

    // Assert
    expect(service.isTagFilteringDisabled()).toBe(true);
    expect(service.selectedSources()).toEqual(['hackernews']);
  });
});