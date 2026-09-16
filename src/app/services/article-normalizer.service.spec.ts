import { ArticleNormalizerService } from './article-normalizer.service';
import { DevToArticle } from './fetchers/devto-fetcher.service';
import { MsLearnCatalogEntry } from './fetchers/mslearn-fetcher.service';
import { HackerNewsHit } from './fetchers/hackernews-fetcher.service';
import { HashnodePost } from './fetchers/hashnode-fetcher.service';
import { GitHubRepo } from './fetchers/github-fetcher.service';

const devToArticle = (overrides: Partial<DevToArticle> = {}): DevToArticle => ({
  id: 1,
  title: 'Understanding Signals',
  description: 'A deep dive into Angular signals.',
  url: 'https://dev.to/articles/1',
  published_at: '2026-01-01T00:00:00Z',
  tag_list: ['Angular', 'WEBDEV'],
  cover_image: 'https://dev.to/images/1.png',
  public_reactions_count: 42,
  user: { name: 'Ada Lovelace' },
  ...overrides,
});

const msLearnEntry = (overrides: Partial<MsLearnCatalogEntry> = {}): MsLearnCatalogEntry => ({
  uid: 'learn.path.1',
  title: 'Build your first AI app',
  summary: 'Learn the basics of building AI apps.',
  url: 'https://learn.microsoft.com/paths/1',
  last_modified: '2026-01-02T00:00:00Z',
  duration_in_minutes: 60,
  ...overrides,
});

const hackerNewsHit = (overrides: Partial<HackerNewsHit> = {}): HackerNewsHit => ({
  objectID: '123',
  title: 'Show HN: My new project',
  url: 'https://example.test/project',
  author: 'pg',
  points: 100,
  created_at: '2026-01-03T00:00:00Z',
  _tags: ['STORY', 'AUTHOR_pg'],
  ...overrides,
});

const hashnodePost = (overrides: Partial<HashnodePost> = {}): HashnodePost => ({
  id: 'post-1',
  title: 'Why Hashnode is great',
  brief: 'A short brief about Hashnode.',
  url: 'https://hashnode.com/post-1',
  publishedAt: '2026-01-04T00:00:00Z',
  coverImage: { url: 'https://hashnode.com/cover-1.png' },
  author: { name: 'Grace Hopper' },
  ...overrides,
});

const gitHubRepo = (overrides: Partial<GitHubRepo> = {}): GitHubRepo => ({
  id: 555,
  name: 'awesome-repo',
  full_name: 'octocat/awesome-repo',
  html_url: 'https://github.com/octocat/awesome-repo',
  description: 'An awesome repository.',
  stargazers_count: 999,
  pushed_at: '2026-01-05T00:00:00Z',
  topics: ['Angular', 'TYPESCRIPT'],
  owner: { login: 'octocat', avatar_url: 'https://github.com/avatars/octocat.png' },
  ...overrides,
});

describe('ArticleNormalizerService', () => {
  let service: ArticleNormalizerService;

  beforeEach(() => {
    service = new ArticleNormalizerService();
  });

  describe('normalizeDevTo', () => {
    it('GivenDevToArticle_WhenNormalized_ThenMapsAllFieldsWithNamespacedIdAndLowercasedTags', () => {
      // Arrange
      const articles = [devToArticle()];

      // Act
      const result = service.normalizeDevTo(articles);

      // Assert
      expect(result).toEqual([
        {
          id: 'devto-1',
          source: 'devto',
          title: 'Understanding Signals',
          url: 'https://dev.to/articles/1',
          summary: 'A deep dive into Angular signals.',
          author: 'Ada Lovelace',
          publishedAt: '2026-01-01T00:00:00Z',
          tags: ['angular', 'webdev'],
          thumbnailUrl: 'https://dev.to/images/1.png',
          metric: { label: 'reactions', value: 42 },
        },
      ]);
    });

    it('GivenDevToArticleWithNullDescriptionAndAuthor_WhenNormalized_ThenSummaryAndAuthorAreNull', () => {
      // Arrange
      const articles = [devToArticle({ description: null, user: { name: null } })];

      // Act
      const result = service.normalizeDevTo(articles);

      // Assert
      expect(result[0].summary).toBeNull();
      expect(result[0].author).toBeNull();
    });

    it('GivenEmptyArray_WhenNormalizeDevToCalled_ThenReturnsEmptyArray', () => {
      // Act
      const result = service.normalizeDevTo([]);

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('normalizeMsLearn', () => {
    it('GivenMsLearnEntry_WhenNormalized_ThenMapsFieldsWithNamespacedIdAndNullAuthorAndEmptyTagsAndNullMetric', () => {
      // Arrange
      const entries = [msLearnEntry()];

      // Act
      const result = service.normalizeMsLearn(entries);

      // Assert
      expect(result).toEqual([
        {
          id: 'mslearn-learn.path.1',
          source: 'mslearn',
          title: 'Build your first AI app',
          url: 'https://learn.microsoft.com/paths/1',
          summary: 'Learn the basics of building AI apps.',
          author: null,
          publishedAt: '2026-01-02T00:00:00Z',
          tags: [],
          thumbnailUrl: null,
          metric: null,
        },
      ]);
    });

    it('GivenMsLearnEntryWithNullSummaryAndLastModified_WhenNormalized_ThenPreservesNullsAsIs', () => {
      // Arrange
      const entries = [msLearnEntry({ summary: null, last_modified: null })];

      // Act
      const result = service.normalizeMsLearn(entries);

      // Assert
      expect(result[0].summary).toBeNull();
      expect(result[0].publishedAt).toBeNull();
    });

    it('GivenEmptyArray_WhenNormalizeMsLearnCalled_ThenReturnsEmptyArray', () => {
      // Act
      const result = service.normalizeMsLearn([]);

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('normalizeHackerNews', () => {
    it('GivenHackerNewsHit_WhenNormalized_ThenMapsFieldsWithNamespacedIdAndLowercasedTagsAndNullSummary', () => {
      // Arrange
      const hits = [hackerNewsHit()];

      // Act
      const result = service.normalizeHackerNews(hits);

      // Assert
      expect(result).toEqual([
        {
          id: 'hackernews-123',
          source: 'hackernews',
          title: 'Show HN: My new project',
          url: 'https://example.test/project',
          summary: null,
          author: 'pg',
          publishedAt: '2026-01-03T00:00:00Z',
          tags: ['story', 'author_pg'],
          thumbnailUrl: null,
          metric: { label: 'points', value: 100 },
        },
      ]);
    });

    it('GivenHitWithNullTitle_WhenNormalized_ThenHitIsFilteredOut', () => {
      // Arrange
      const hits = [hackerNewsHit({ title: null }), hackerNewsHit({ objectID: '456' })];

      // Act
      const result = service.normalizeHackerNews(hits);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('hackernews-456');
    });

    it('GivenHitWithNullUrl_WhenNormalized_ThenFallsBackToHackerNewsItemUrl', () => {
      // Arrange
      const hits = [hackerNewsHit({ url: null, objectID: '789' })];

      // Act
      const result = service.normalizeHackerNews(hits);

      // Assert
      expect(result[0].url).toBe('https://news.ycombinator.com/item?id=789');
    });

    it('GivenHitWithNullPoints_WhenNormalized_ThenMetricValueDefaultsToZero', () => {
      // Arrange
      const hits = [hackerNewsHit({ points: null })];

      // Act
      const result = service.normalizeHackerNews(hits);

      // Assert
      expect(result[0].metric).toEqual({ label: 'points', value: 0 });
    });

    it('GivenEmptyArray_WhenNormalizeHackerNewsCalled_ThenReturnsEmptyArray', () => {
      // Act
      const result = service.normalizeHackerNews([]);

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('normalizeHashnode', () => {
    it('GivenHashnodePost_WhenNormalized_ThenMapsFieldsWithNamespacedIdAndEmptyTagsAndNullMetric', () => {
      // Arrange
      const posts = [hashnodePost()];

      // Act
      const result = service.normalizeHashnode(posts);

      // Assert
      expect(result).toEqual([
        {
          id: 'hashnode-post-1',
          source: 'hashnode',
          title: 'Why Hashnode is great',
          url: 'https://hashnode.com/post-1',
          summary: 'A short brief about Hashnode.',
          author: 'Grace Hopper',
          publishedAt: '2026-01-04T00:00:00Z',
          tags: [],
          thumbnailUrl: 'https://hashnode.com/cover-1.png',
          metric: null,
        },
      ]);
    });

    it('GivenPostWithNullAuthorAndCoverImage_WhenNormalized_ThenAuthorAndThumbnailUrlAreNull', () => {
      // Arrange
      const posts = [hashnodePost({ author: null, coverImage: null })];

      // Act
      const result = service.normalizeHashnode(posts);

      // Assert
      expect(result[0].author).toBeNull();
      expect(result[0].thumbnailUrl).toBeNull();
    });

    it('GivenEmptyArray_WhenNormalizeHashnodeCalled_ThenReturnsEmptyArray', () => {
      // Act
      const result = service.normalizeHashnode([]);

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('normalizeGitHub', () => {
    it('GivenGitHubRepo_WhenNormalized_ThenMapsFieldsWithNamespacedIdAndLowercasedTopics', () => {
      // Arrange
      const repos = [gitHubRepo()];

      // Act
      const result = service.normalizeGitHub(repos);

      // Assert
      expect(result).toEqual([
        {
          id: 'github-555',
          source: 'github',
          title: 'octocat/awesome-repo',
          url: 'https://github.com/octocat/awesome-repo',
          summary: 'An awesome repository.',
          author: 'octocat',
          publishedAt: '2026-01-05T00:00:00Z',
          tags: ['angular', 'typescript'],
          thumbnailUrl: 'https://github.com/avatars/octocat.png',
          metric: { label: 'stars', value: 999 },
        },
      ]);
    });

    it('GivenRepoWithNullDescription_WhenNormalized_ThenSummaryIsNull', () => {
      // Arrange
      const repos = [gitHubRepo({ description: null })];

      // Act
      const result = service.normalizeGitHub(repos);

      // Assert
      expect(result[0].summary).toBeNull();
    });

    it('GivenEmptyArray_WhenNormalizeGitHubCalled_ThenReturnsEmptyArray', () => {
      // Act
      const result = service.normalizeGitHub([]);

      // Assert
      expect(result).toEqual([]);
    });
  });
});
