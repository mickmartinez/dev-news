import { TestBed } from '@angular/core/testing';
import { Subject, of } from 'rxjs';
import { ArticleSource, UnifiedArticle } from '../models/article.model';
import { DEVNEWS_TAGS, GITHUB_TAGS, MSLEARN_TAGS } from '../data/topic-tags';
import { NewsFeedResult, NewsAggregatorService } from './news-aggregator.service';
import { NewsFeedStateService } from './news-feed-state.service';

const dedupeLower = (...tagSets: readonly (readonly string[])[]): string[] => {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const tagSet of tagSets) {
    for (const tag of tagSet) {
      const normalized = tag.toLowerCase();
      if (!seen.has(normalized)) {
        seen.add(normalized);
        result.push(normalized);
      }
    }
  }
  return result;
};

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
      of<NewsFeedResult>({ articles: [article('devto-1', 'devto')], failedSources: ['github'] }),
    );

    // Act
    service.loadFeed();

    // Assert
    expect(service.articles()).toEqual([article('devto-1', 'devto')]);
    expect(service.failedSources()).toEqual(['github']);
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

  it('GivenOnlyHackerNewsSelected_WhenIsTagFilteringDisabledRead_ThenFalse', () => {
    // Arrange
    service.toggleSourceFilter('hackernews');

    // Act
    const disabled = service.isTagFilteringDisabled();

    // Assert
    expect(disabled).toBe(false);
  });

  it('GivenOnlyMsLearnSelected_WhenIsTagFilteringDisabledRead_ThenFalse', () => {
    // Arrange
    service.toggleSourceFilter('mslearn');

    // Act
    const disabled = service.isTagFilteringDisabled();

    // Assert
    expect(disabled).toBe(false);
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

  it('GivenHackerNewsAndMsLearnBothSelectedAndNothingElse_WhenIsTagFilteringDisabledRead_ThenFalse', () => {
    // Arrange
    service.toggleSourceFilter('hackernews');
    service.toggleSourceFilter('mslearn');

    // Act
    const disabled = service.isTagFilteringDisabled();

    // Assert
    expect(disabled).toBe(false);
  });

  it('GivenOnlyHackerNewsSelectedAndATopicTagSelected_WhenFilteredArticlesRead_ThenOnlyHackerNewsArticlesMatchingThatTopicAreReturned', () => {
    // Arrange
    fetchFeed.mockReturnValue(
      of<NewsFeedResult>({
        articles: [article('hn-angular', 'hackernews', ['angular']), article('hn-azure', 'hackernews', ['azure'])],
        failedSources: [],
      }),
    );
    service.loadFeed();
    service.toggleSourceFilter('hackernews');
    service.toggleTagFilter('angular');

    // Act
    const result = service.filteredArticles();

    // Assert
    expect(result.map((item) => item.id)).toEqual(['hn-angular']);
  });

  it('GivenOnlyMsLearnSelectedAndATopicTagSelected_WhenFilteredArticlesRead_ThenOnlyMsLearnArticlesMatchingThatTopicAreReturned', () => {
    // Arrange
    fetchFeed.mockReturnValue(
      of<NewsFeedResult>({
        articles: [article('ms-angular', 'mslearn', ['angular']), article('ms-azure', 'mslearn', ['azure'])],
        failedSources: [],
      }),
    );
    service.loadFeed();
    service.toggleSourceFilter('mslearn');
    service.toggleTagFilter('angular');

    // Act
    const result = service.filteredArticles();

    // Assert
    expect(result.map((item) => item.id)).toEqual(['ms-angular']);
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

  it('GivenNoSourcesAreCurrentlyUntaggable_WhenAnySingleSourceIsSelected_ThenIsTagFilteringDisabledIsAlwaysFalse', () => {
    // Arrange
    service.toggleSourceFilter('hackernews');
    expect(service.isTagFilteringDisabled()).toBe(false);
    service.toggleSourceFilter('hackernews');

    // Act
    service.toggleSourceFilter('mslearn');

    // Assert
    expect(service.isTagFilteringDisabled()).toBe(false);
  });

  it('GivenNoSourcesSelected_WhenAvailableTagsRead_ThenReturnsLowercasedDedupedUnionOfAllFourTagSets', () => {
    // Arrange
    // (no sources selected by default)

    // Act
    const tags = service.availableTags();

    // Assert
    expect(tags).toEqual(dedupeLower(DEVNEWS_TAGS, MSLEARN_TAGS, DEVNEWS_TAGS, GITHUB_TAGS));
  });

  it('GivenOnlyDevtoSelected_WhenAvailableTagsRead_ThenReturnsOnlyDevnewsTagsLowercased', () => {
    // Arrange
    service.toggleSourceFilter('devto');

    // Act
    const tags = service.availableTags();

    // Assert
    expect(tags).toEqual(dedupeLower(DEVNEWS_TAGS));
  });

  it('GivenOnlyHackerNewsSelected_WhenAvailableTagsRead_ThenReturnsTheSameSetAsOnlyDevtoSelected', () => {
    // Arrange
    service.toggleSourceFilter('hackernews');

    // Act
    const tags = service.availableTags();

    // Assert
    expect(tags).toEqual(dedupeLower(DEVNEWS_TAGS));
  });

  it('GivenOnlyMsLearnSelected_WhenAvailableTagsRead_ThenReturnsOnlyMslearnTagsLowercased', () => {
    // Arrange
    service.toggleSourceFilter('mslearn');

    // Act
    const tags = service.availableTags();

    // Assert
    expect(tags).toEqual(dedupeLower(MSLEARN_TAGS));
  });

  it('GivenOnlyGithubSelected_WhenAvailableTagsRead_ThenReturnsOnlyGithubTagsLowercased', () => {
    // Arrange
    service.toggleSourceFilter('github');

    // Act
    const tags = service.availableTags();

    // Assert
    expect(tags).toEqual(dedupeLower(GITHUB_TAGS));
  });

  it('GivenMsLearnAndGithubBothSelected_WhenAvailableTagsRead_ThenReturnsDedupedUnionOfBothTagSetsWithNoDuplicateEntries', () => {
    // Arrange
    service.toggleSourceFilter('mslearn');
    service.toggleSourceFilter('github');

    // Act
    const tags = service.availableTags();

    // Assert
    expect(tags).toEqual(dedupeLower(MSLEARN_TAGS, GITHUB_TAGS));
    expect(new Set(tags).size).toBe(tags.length);
  });

  it('GivenTwoSourcesWithOverlappingTagsDifferingOnlyByCase_WhenAvailableTagsRead_ThenTheOverlappingTagAppearsExactlyOnce', () => {
    // Arrange
    service.toggleSourceFilter('devto');
    service.toggleSourceFilter('mslearn');

    // Act
    const tags = service.availableTags();

    // Assert
    expect(tags.filter((tag) => tag === 'c#')).toHaveLength(1);
  });

  it('GivenSourceSelectionOrderDiffersButSelectedSetIsTheSame_WhenAvailableTagsReadTwice_ThenTheReturnedArrayOrderIsIdenticalBothTimes', () => {
    // Arrange
    service.toggleSourceFilter('mslearn');
    service.toggleSourceFilter('github');
    const firstOrderTags = [...service.availableTags()];
    service.clearFilters();

    // Act
    service.toggleSourceFilter('github');
    service.toggleSourceFilter('mslearn');
    const secondOrderTags = service.availableTags();

    // Assert
    expect(secondOrderTags).toEqual(firstOrderTags);
  });

  it('GivenDevtoAndHackerNewsBothSelected_WhenAvailableTagsRead_ThenNoDuplicateTagsAppearDespiteBothMappingToDevnewsTags', () => {
    // Arrange
    service.toggleSourceFilter('devto');
    service.toggleSourceFilter('hackernews');

    // Act
    const tags = service.availableTags();

    // Assert
    expect(tags).toEqual(dedupeLower(DEVNEWS_TAGS));
    expect(new Set(tags).size).toBe(tags.length);
  });

  it('GivenASourceSelectedThatIsNotInSourceTagSets_WhenAvailableTagsRead_ThenNoErrorIsThrownAndThatSourceContributesNoTags', () => {
    // Arrange
    const unmappedSource = 'rss' as unknown as ArticleSource;

    // Act
    const act = () => service.toggleSourceFilter(unmappedSource);

    // Assert
    expect(act).not.toThrow();
    expect(service.availableTags()).toEqual([]);
  });

  it('GivenAGithubOnlyTagSelected_WhenGithubIsDeselectedLeavingZeroSources_ThenThatTagRemainsSelectedBecauseItIsPartOfTheFullUnion', () => {
    // Arrange
    service.toggleSourceFilter('github');
    service.toggleTagFilter('langchain');

    // Act
    service.toggleSourceFilter('github');

    // Assert
    expect(service.selectedTags()).toEqual(['langchain']);
  });

  it('GivenAGithubOnlyTagSelectedWhileGithubIsAmongSelectedSources_WhenGithubIsDeselectedLeavingAnotherNonMatchingSourceSelected_ThenThatTagIsRemovedFromSelectedTagsAndNoLongerPresentInAvailableTags', () => {
    // Arrange
    service.toggleSourceFilter('devto');
    service.toggleSourceFilter('github');
    service.toggleTagFilter('langchain');

    // Act
    service.toggleSourceFilter('github');

    // Assert
    expect(service.selectedTags()).toEqual([]);
    expect(service.availableTags()).not.toContain('langchain');
  });

  it('GivenATagValidForBothSelectedSources_WhenOneOfTheTwoSourcesIsDeselected_ThenThatTagRemainsSelectedIfStillInTheNarrowedAvailableTagsSet', () => {
    // Arrange
    service.toggleSourceFilter('mslearn');
    service.toggleSourceFilter('github');
    service.toggleTagFilter('azure');

    // Act
    service.toggleSourceFilter('mslearn');

    // Assert
    expect(service.selectedTags()).toEqual(['azure']);
  });

  it('GivenMultipleSelectedTagsWhereSomeBecomeOutOfScopeAndSomeDoNot_WhenSourceSelectionNarrows_ThenOnlyTheOutOfScopeTagsAreRemovedFromSelectedTags', () => {
    // Arrange
    service.toggleSourceFilter('mslearn');
    service.toggleSourceFilter('github');
    service.toggleTagFilter('azure');
    service.toggleTagFilter('langchain');

    // Act
    service.toggleSourceFilter('github');

    // Assert
    expect(service.selectedTags()).toEqual(['azure']);
  });

  it('GivenToggleSourceFilterCalled_WhenSelectedSourcesChange_ThenAvailableTagsSignalRecomputesSynchronouslyWithNoAdditionalAction', () => {
    // Arrange
    // (no extra setup — recomputation must happen inside the same toggle call)

    // Act
    service.toggleSourceFilter('github');

    // Assert
    expect(service.availableTags()).toEqual(dedupeLower(GITHUB_TAGS));
  });

  it('GivenClearFiltersCalled_WhenSelectedTagsAndSelectedSourcesAreBothRead_ThenBothAreEmptyAndAvailableTagsReturnsToTheFullUnion', () => {
    // Arrange
    service.toggleSourceFilter('github');
    service.toggleTagFilter('langchain');

    // Act
    service.clearFilters();

    // Assert
    expect(service.selectedSources()).toEqual([]);
    expect(service.selectedTags()).toEqual([]);
    expect(service.availableTags()).toEqual(dedupeLower(DEVNEWS_TAGS, MSLEARN_TAGS, DEVNEWS_TAGS, GITHUB_TAGS));
  });
});