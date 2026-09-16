# As a developer user, I want to see a single aggregated feed of developer content so that I don't need to visit five separate sites

## Description
Developers currently have to check multiple sites — Dev.to, Microsoft Learn, Hacker News, Hashnode, and GitHub — to stay on top of relevant content. This story delivers a single, real-time news feed that combines articles/items from all five sources into one unified view, filtered to topics the user cares about (AI, .NET, Angular, Testing, Azure, Anthropic, Claude, GitHub, plus Microsoft Learn AI certification paths). The feed always reflects the current state of each source — nothing is cached to disk — and remains useful even when some sources are temporarily unavailable.

## Scenario

### Scenario 1: Happy path — all sources available
**Given** the user opens the news portal
**When** the feed loads
**Then** the user sees a loading indicator while data is being fetched
**And** once fetching completes, the user sees a combined, reverse-chronological (or otherwise ranked) list of articles from Dev.to, Microsoft Learn, Hacker News, Hashnode, and GitHub
**And** each article card displays its source, title, and a relevant engagement metric where available (Hacker News → points, GitHub → stars, Dev.to → reactions)
**And** articles without a publish date simply omit the date field rather than showing an invalid or placeholder date

### Scenario 2: Partial source failure
**Given** the user opens the news portal
**When** one or more (but not all) of the five sources fails to return data
**Then** the feed still renders the articles from the sources that succeeded
**And** a non-blocking, per-source error notice informs the user which source(s) failed
**And** the user can continue to browse, filter, and favorite the successfully loaded articles

### Scenario 3: Full feed failure
**Given** the user opens the news portal
**When** all five sources fail to return data
**Then** the user sees a full-feed error state instead of an empty or broken list
**And** the error state includes a retry action that re-attempts fetching all five sources

### Scenario 4: Filtering by source
**Given** the feed has loaded with articles from multiple sources
**When** the user selects one or more sources as a filter
**Then** only articles from the selected source(s) are shown
**And** the user can clear the filter to see all sources again

### Scenario 5: Filtering by tag/topic
**Given** the feed has loaded with articles from multiple sources
**When** the user selects one or more topics of interest (AI, .NET, Angular, Testing, Azure, Anthropic, Claude, GitHub, or a Microsoft Learn AI certification path such as Foundry, Foundry IQ, Work IQ, AI Search, Speech, Video Indexer, Language, Agents, Workflows, Agent Framework)
**Then** only articles matching the selected topic(s) are shown
**And** source and tag filters can be combined

### Scenario 6: Reload always fetches fresh data
**Given** the user has already loaded the feed once
**When** the user reloads or revisits the feed
**Then** all five sources are queried again in real time
**And** no previously fetched feed data is read from local/disk storage to populate the view

## Acceptance Criteria

### Core Functionality
- The feed combines content from exactly five sources: Dev.to, Microsoft Learn, Hacker News, Hashnode, and GitHub.
- The feed is fetched live on every page load/reload; feed data is never persisted to or read from disk-based cache.
- Each article card displays, at minimum: title, source, and (where available) an engagement metric appropriate to its source (points for Hacker News, stars for GitHub, reactions for Dev.to).
- Microsoft Learn and Hashnode items are displayed without an engagement metric when none is available, rather than showing a placeholder or zero value.
- Articles missing a publish date are displayed without a date field; no invalid/placeholder date (e.g. "Invalid Date", "01/01/1970") is ever shown.

### Input Validation
- Source filter accepts any combination of one or more of the five sources; selecting zero sources is treated as "all sources" or is prevented (must always show at least one state, not a broken empty selection).
- Tag/topic filter accepts any combination of the defined topics (AI, .NET, Angular, Testing, Azure, Anthropic, Claude, GitHub) and Microsoft Learn AI certification paths (Foundry, Foundry IQ, Work IQ, AI Search, Speech, Video Indexer, Language, Agents, Workflows, Agent Framework).
- Source and tag filters can be applied simultaneously and combine as a logical AND (article must match selected source AND selected tag criteria).

### User Experience
- A loading indicator is shown while the feed is being fetched, and is dismissed once the fetch completes (successfully or with errors).
- Per-source error notices are non-blocking — they do not prevent the user from viewing, filtering, or interacting with successfully loaded articles.
- A full-feed error state (all 5 sources failed) is visually distinct from a partial-degradation state and includes a clear retry action.
- Retrying re-fetches all five sources fresh; it does not reuse any previously failed or partial results.
- Filters are easy to discover and clear/reset without reloading the page.

### Security & Access Control
- No user credentials or account data are required to view the feed; it is accessible without authentication.
- External source responses are treated as untrusted input and rendered safely (no raw HTML/script injection from article titles, summaries, or metadata).

### Data Integrity
- Each article displays its true originating source; articles are never mislabeled or merged in a way that loses their source identity.
- Duplicate articles (e.g. the same item appearing from two sources) are not required to be deduplicated unless explicitly specified as a separate rule.

### Error Handling
- If a single source times out or errors, the user sees a specific, identifiable notice for that source (e.g. "Hacker News is currently unavailable") rather than a generic error.
- If all sources fail, the user-facing message clearly states the feed could not be loaded and offers the retry action.
- Errors from one source never cause articles from other, successful sources to be hidden or lost.

### Performance & Sustainability / Green Code
- The feed does not persist fetched data to disk, avoiding unnecessary storage growth from a feature that is explicitly real-time only.
- Sources are queried independently so that a slow or failing source does not block the other four from rendering as soon as they return.
- Large result sets from any single source are reasonably bounded/paginated so the feed does not force excessive rendering or DOM growth on a single view.

## Prerequisites
None — this is the foundational story for the news portal.
