import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, TestRequest, provideHttpClientTesting } from '@angular/common/http/testing';
import { GITHUB_TAGS } from '../../data/topic-tags';
import { GitHubFetcherService, GitHubRepo } from './github-fetcher.service';

const GITHUB_SEARCH_API = 'https://api.github.com/search/repositories';
const CHUNK_SIZE = 6;

/** Mirrors the production chunking/quoting logic so assertions track DEVNEWS_TAGS, not a hardcoded copy. */
const expectedQueries = (): string[] => {
  const queries: string[] = [];
  for (let i = 0; i < GITHUB_TAGS.length; i += CHUNK_SIZE) {
    const chunk = GITHUB_TAGS.slice(i, i + CHUNK_SIZE);
    queries.push(chunk.map((tag) => (tag.includes(' ') ? `"${tag}"` : tag)).join(' OR '));
  }
  return queries;
};

const gitHubRepo = (overrides: Partial<GitHubRepo> = {}): GitHubRepo => ({
  id: 1,
  name: 'repo',
  full_name: 'octocat/repo',
  html_url: 'https://github.com/octocat/repo',
  description: null,
  stargazers_count: 0,
  pushed_at: '2026-01-01T00:00:00Z',
  topics: [],
  owner: { login: 'octocat', avatar_url: 'https://example.test/octocat.png' },
  ...overrides,
});

describe('GitHubFetcherService', () => {
  let service: GitHubFetcherService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(GitHubFetcherService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  /**
   * `mergeMap`'s concurrency cap (2) means later chunks aren't requested until an earlier one
   * completes. `httpMock.match()` consumes whatever is currently pending as soon as it's called,
   * so an entire wave must be flushed before re-querying — flushing one at a time across calls
   * would orphan the unflushed request and permanently starve a concurrency slot.
   */
  const drainRequests = (
    respond: (req: TestRequest, index: number) => void,
  ): TestRequest[] => {
    const seen: TestRequest[] = [];
    let pending = httpMock.match(() => true);
    while (pending.length > 0) {
      for (const req of pending) {
        seen.push(req);
        respond(req, seen.length - 1);
      }
      pending = httpMock.match(() => true);
    }
    return seen;
  };

  it('batches tags into queries of at most 6 OR operators each', () => {
    service.fetchArticles().subscribe();

    const queries = expectedQueries();
    const requests = drainRequests((req) => req.flush({ items: [] }));

    expect(requests.length).toBe(queries.length);
    requests.forEach((req, index) => {
      expect(req.request.url).toBe(GITHUB_SEARCH_API);
      expect(req.request.params.get('q')).toBe(queries[index]);
      expect(req.request.params.get('q')?.split(' OR ').length).toBeLessThanOrEqual(6);
    });
  });

  it('quotes multi-word tags as phrases instead of letting them break into bare OR terms', () => {
    service.fetchArticles().subscribe();

    const requests = drainRequests((req) => req.flush({ items: [] }));
    const allQueries = requests.map((req) => req.request.params.get('q') ?? '');

    for (const tag of GITHUB_TAGS.filter((t) => t.includes(' '))) {
      expect(allQueries.some((q) => q.includes(`"${tag}"`))).toBe(true);
    }
  });

  it('dedupes repos returned by multiple chunks and sorts by stars descending', () => {
    const low = gitHubRepo({ id: 1, stargazers_count: 10 });
    const high = gitHubRepo({ id: 2, stargazers_count: 500 });
    const duplicateOfHigh = gitHubRepo({ id: 2, stargazers_count: 500, name: 'repo-dup' });

    let result: GitHubRepo[] | undefined;
    service.fetchArticles().subscribe((repos) => (result = repos));

    drainRequests((req, index) => {
      if (index === 0) return req.flush({ items: [low, high] });
      if (index === 1) return req.flush({ items: [duplicateOfHigh] });
      return req.flush({ items: [] });
    });

    expect(result?.map((r) => r.id)).toEqual([2, 1]);
  });

  it('falls back to an empty result for a chunk whose request errors, without failing the others', () => {
    const repo = gitHubRepo({ id: 7, stargazers_count: 42 });

    let result: GitHubRepo[] | undefined;
    service.fetchArticles().subscribe((repos) => (result = repos));

    drainRequests((req, index) => {
      if (index === 0) return req.flush('boom', { status: 403, statusText: 'Forbidden' });
      if (index === 1) return req.flush({ items: [repo] });
      return req.flush({ items: [] });
    });

    expect(result).toEqual([repo]);
  });
});
