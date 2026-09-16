# Personal Developer News Portal — Product Specification

## 1. Overview

The Personal Developer News Portal is a single-page Angular 22 application that aggregates
developer-relevant content from five external sources into one unified, real-time news feed.
Users can browse the aggregated feed and save articles locally as "Favorites" for later
reading, persisted offline via IndexedDB (Dexie.js).

### 1.1 Goals
- Provide a single pane of glass over Dev.to, Microsoft Learn, Hacker News, Hashnode, and
  GitHub trending repositories, filtered to topics relevant to AI, .NET, Angular, Testing,
  Azure, Anthropic, Claude, and GitHub.
- Guarantee freshness: the feed is never served from a local cache/disk — every load re-fetches
  from the live APIs.
- Allow users to curate a durable, offline-available list of Favorite articles.

### 1.2 Non-Goals
- No user authentication or multi-device sync.
- No server-side aggregation proxy (all fetching happens client-side, in-browser).
- No offline caching of the general feed (only Favorites are persisted).

## 2. Architecture

### 2.1 Stack Constraints
| Concern | Decision |
|---|---|
| Framework | Angular 22, Strict Mode |
| Components | Standalone only — no NgModules anywhere in the app |
| Local persistence | Dexie.js over IndexedDB — exclusively for the Favorites feature |
| Forbidden storage | `localStorage` / `sessionStorage` must not be used for app state |
| Feed caching | Disallowed — feed data fetched live on every component load |
| Data shape | All external payloads normalized to a single `UnifiedArticle` interface before reaching any component |

### 2.2 High-Level Data Flow

```mermaid
flowchart LR
    subgraph External APIs
        A1[Dev.to API]
        A2[Microsoft Learn API/RSS]
        A3[Hacker News - Algolia API]
        A4[Hashnode GraphQL]
        A5[GitHub Search API]
    end

    subgraph Data Layer
        F1[DevToFetcherService]
        F2[MsLearnFetcherService]
        F3[HackerNewsFetcherService]
        F4[HashnodeFetcherService]
        F5[GitHubFetcherService]
        N[ArticleNormalizerService]
        AGG[NewsAggregatorService]
    end

    subgraph State/Storage
        FAV[FavoritesStoreService - Dexie/IndexedDB]
    end

    subgraph UI Layer
        FEED[Feed Component]
        CARD[Article Card Component]
        FAVPAGE[Favorites Component]
    end

    A1 --> F1 --> N
    A2 --> F2 --> N
    A3 --> F3 --> N
    A4 --> F4 --> N
    A5 --> F5 --> N
    N --> AGG
    AGG -->|UnifiedArticle[]| FEED
    FEED --> CARD
    CARD -->|toggle favorite| FAV
    FAV -->|UnifiedArticle[]| FAVPAGE
```

### 2.3 Component/Service Responsibilities
- **Fetcher services** (one per API): responsible only for calling the external endpoint and
  returning the raw, provider-specific response shape. They never expose `UnifiedArticle`
  directly.
- **ArticleNormalizerService**: pure mapping functions, one per source, converting each raw
  provider payload into `UnifiedArticle[]`. No HTTP calls, no side effects — fully unit
  testable in isolation.
- **NewsAggregatorService**: orchestrates parallel fetches (`forkJoin`/`combineLatest` over the
  5 fetchers), delegates normalization, merges results, sorts by publish date, and exposes a
  single observable stream to the UI. Fetch failures from one source must not block the others
  (partial results degrade gracefully).
- **FavoritesStoreService**: wraps a Dexie database/table and exposes add/remove/list/isFavorite
  operations backed by IndexedDB. This is the only service permitted to persist data to disk.
- **UI components**: Feed (list + loading/error states), Article Card (render + favorite
  toggle), Favorites (list of persisted articles). All standalone, signal-driven where
  applicable.

## 3. The Data Contract — `UnifiedArticle`

Every article rendered by the UI, regardless of source, conforms to this interface
(implemented in Step 2 at `src/app/models/article.model.ts`):

```ts
export type ArticleSource = 'devto' | 'mslearn' | 'hackernews' | 'hashnode' | 'github';

export interface UnifiedArticle {
  id: string;                 // stable unique id, namespaced by source (e.g. "devto-12345")
  source: ArticleSource;
  title: string;
  url: string;
  summary: string | null;
  author: string | null;
  publishedAt: string | null; // ISO 8601, null if unavailable (e.g. GitHub repo without a date)
  tags: string[];              // normalized, lowercase
  thumbnailUrl: string | null;
  metric: {
    label: string;             // e.g. "reactions", "points", "stars"
    value: number;
  } | null;
}
```

### 3.1 Source Mapping Summary
| Source | Raw Identifier | Notes |
|---|---|---|
| Dev.to | article `id` | Tags filter: AI, .NET, Angular, Testing, Azure, Anthropic, Claude, Github |
| Microsoft Learn | path/module `uid` or RSS `guid` | Filter: Foundry, Foundry IQ, Work IQ, AI Search, Speech, Video Indexer, Language, Agents, Workflows, Agent Framework certification paths and their .NET SDK docs |
| Hacker News (Algolia) | `objectID` | Query restricted to Dev.to tag set; `metric.label = "points"` |
| Hashnode (GraphQL) | post `id` | Query restricted to Dev.to tag set |
| GitHub Search | repo `id` | Trending repos matching Dev.to tag set; `metric.label = "stars"` |

## 4. User Stories

### Epic A: Aggregated News Feed

#### A1 — View the aggregated feed
**As a** developer user
**I want** to see a single feed combining Dev.to, Microsoft Learn, Hacker News, Hashnode, and
GitHub content
**So that** I don't need to visit five separate sites to stay current.

**Acceptance Criteria**
- Given the user opens the app, when the Feed component loads, then it triggers a live fetch
  against all 5 sources concurrently (no cached/stale data is read from disk).
- Given all 5 sources return successfully, when normalization completes, then the feed displays
  a merged, chronologically sorted (newest first) list of `UnifiedArticle` items.
- Given the fetch is in progress, when the user is viewing the feed, then a loading indicator is
  shown until the first render of results.
- Given one or more sources fail (e.g. network error, non-2xx response), when the others
  succeed, then the feed still renders the successful sources' articles and shows a
  non-blocking, per-source error notice (partial degradation, not a full-page error).
- Given all 5 sources fail, when the fetch completes, then the UI shows a full-feed error state
  with a retry action.
- Given the user reloads or revisits the Feed component, when it initializes again, then a
  brand-new live fetch is performed — no article data is read from a local cache or IndexedDB
  for the feed itself.

#### A2 — Filter feed by source or tag
**As a** developer user
**I want** to filter the feed by source and/or tag
**So that** I can focus on the topics I care about right now.

**Acceptance Criteria**
- Given the feed has loaded, when the user selects one or more source filters (Dev.to, MS
  Learn, HN, Hashnode, GitHub), then only articles from the selected sources are shown.
- Given the feed has loaded, when the user selects a tag, then only articles whose `tags` array
  contains that tag are shown.
- Given no filters are selected, when the feed renders, then all normalized articles from all
  sources are shown.

#### A3 — Identify article source and metric at a glance
**As a** developer user
**I want** each article card to clearly show its originating source and a relevant engagement
metric (points, stars, or reactions)
**So that** I can judge relevance and popularity quickly.

**Acceptance Criteria**
- Given an article card is rendered, when it originates from Hacker News, then it displays a
  "points" metric; from GitHub, a "stars" metric; from Dev.to, a "reactions" metric (when
  present); Microsoft Learn and Hashnode display `null` metric gracefully (no broken UI).
- Given an article has no publish date (`publishedAt === null`), when rendered, then the card
  omits the date instead of showing an invalid/empty date string.

### Epic B: Favorites (Persisted via Dexie/IndexedDB)

#### B1 — Save an article to Favorites
**As a** developer user
**I want** to mark any article in the feed as a Favorite
**So that** I can find it again later without re-searching the feed.

**Acceptance Criteria**
- Given an article card in the feed, when the user activates the favorite toggle, then the
  `UnifiedArticle` is written to the Dexie `favorites` IndexedDB table.
- Given the article is already a favorite, when the card renders, then the toggle reflects the
  "favorited" (active) state by checking the Dexie store, not any in-memory-only flag.
- Given the app is closed and reopened, when the user views a previously favorited article in
  the feed, then it still shows as favorited (persistence survives full page reloads/restarts).
- Given a write to IndexedDB fails, when the toggle action occurs, then the UI surfaces an
  error and does not silently claim success.

#### B2 — Remove an article from Favorites
**As a** developer user
**I want** to un-favorite an article
**So that** I can keep my saved list relevant.

**Acceptance Criteria**
- Given a favorited article, when the user toggles it off (from either the Feed or the
  Favorites view), then its record is deleted from the Dexie `favorites` table.
- Given the removal completes, when the Favorites view is visible, then the article
  immediately disappears from the list without requiring a manual refresh.

#### B3 — View all Favorites offline
**As a** developer user
**I want** a dedicated Favorites view listing all saved articles
**So that** I can read them later, even without a fresh feed fetch.

**Acceptance Criteria**
- Given one or more favorites exist, when the user navigates to the Favorites view, then all
  saved `UnifiedArticle` records are read directly from IndexedDB (no external API calls are
  made to render this view).
- Given zero favorites exist, when the user navigates to the Favorites view, then an empty-state
  message is shown instead of an empty list with no context.
- Given the device has no network connectivity, when the user opens the Favorites view, then it
  still renders successfully since it depends only on local Dexie data.

## 5. Non-Functional Requirements
- **Strict typing**: no `any` in the data layer; all fetcher/normalizer functions are fully
  typed against provider response shapes and `UnifiedArticle`.
- **Resilience**: aggregator must isolate per-source failures (`catchError` per fetch) so one
  broken API cannot fail the whole feed.
- **Testability**: normalizer and Dexie storage logic must be unit-testable without a live
  network or browser IndexedDB where feasible (fake/in-memory Dexie for tests).
- **CI**: all unit tests run headlessly (ChromeHeadless or Angular's native test runner) so the
  GitHub Actions pipeline (Step 6) can succeed without a GUI.

## 6. Open Questions / Assumptions
- Microsoft Learn does not expose a single official "articles" REST API for arbitrary topic
  search; the fetcher will target the public Learn catalog/RSS feeds filtered to the specified
  certification/topic areas, normalized identically to the other sources.
- Rate limits (Hacker News/Algolia, GitHub Search unauthenticated) are assumed sufficient for a
  personal-use portal; no API keys are provisioned in this spec.
