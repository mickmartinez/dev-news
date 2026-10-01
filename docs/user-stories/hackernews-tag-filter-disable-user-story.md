# As a developer user, I want the Topics filter to be disabled when it can't affect my results so that I don't get a confusing empty feed

## Status Update (superseded for Hacker News)

The root cause described below has been fixed at the data layer instead: `HackerNewsFetcherService.fetchArticles()` now tracks which `DEVNEWS_TAGS` query term returned each hit (`matchedTopics`), and `ArticleNormalizerService.normalizeHackerNews` derives real topic tags from it instead of Algolia's unrelated `_tags` metadata. Hacker News articles are therefore genuinely topic-filterable now, and disabling the Topics filter is **no longer necessary for Hacker News** — all scenarios and acceptance criteria below that reference Hacker News specifically no longer apply to it. See [docs/specs/hackernews-tag-filter-disable.md](../specs/hackernews-tag-filter-disable.md) for the updated technical write-up.

The general mechanism this story introduced (`NewsFeedStateService.isTagFilteringDisabled`, driven by an `UNTAGGABLE_SOURCES` set) remains in the codebase, since it's still needed for any source whose normalizer can't yet derive real topic tags (currently: Hashnode, tracked as a known gap in [docs/specs/aggregated-news-feed.md](../specs/aggregated-news-feed.md)).

## Description
Hacker News articles are matched against the app's topic taxonomy at fetch time via a full-text search query, not via a taggable topic field — so Hacker News articles never carry any of the app's defined topics (e.g. "angular", "typescript", "dotnet") in their tag data. As a result, whenever Hacker News is the only selected source, applying any Topics filter always produces zero results, with no indication to the user why the feed suddenly went empty. This story makes that limitation visible and predictable by disabling the Topics filter controls whenever they cannot meaningfully narrow the results, and re-enabling them automatically as soon as they can.

**(Superseded, see Status Update above)** The scenarios, acceptance criteria, and examples below describe the original Hacker-News-specific problem and remain valid as the general design for any future untaggable source, but they no longer describe Hacker News's actual behavior.


## Scenario

### Scenario 1: Selecting Hacker News as the only source disables Topics
**Given** the user is viewing the aggregated feed with no source filter selected (or a source other than only Hacker News selected)
**When** the user selects Hacker News as a source filter such that Hacker News is now the only selected source
**Then** the Topics filter controls become disabled and are no longer clickable
**And** the feed continues to show Hacker News articles filtered only by the selected source

### Scenario 2: Topics filter is already disabled while Hacker News is the only source
**Given** Hacker News is the only selected source and the Topics filter controls are disabled
**When** the user attempts to interact with a Topics filter control
**Then** no tag selection changes and the control does not respond as clickable

### Scenario 3: Broadening the source selection re-enables Topics
**Given** Hacker News is the only selected source and the Topics filter controls are disabled
**When** the user selects an additional source (so more than one source is now selected)
**Then** the Topics filter controls become enabled again
**And** any topics that were selected before Hacker News became the only source are re-applied to the feed

### Scenario 4: Deselecting Hacker News re-enables Topics
**Given** Hacker News is the only selected source and the Topics filter controls are disabled
**When** the user deselects Hacker News, leaving zero sources selected (i.e. "all sources")
**Then** the Topics filter controls become enabled again
**And** any previously selected topics are re-applied to the feed, now across all sources

### Scenario 5: Selecting a different single source keeps Topics enabled
**Given** no source filter is currently selected
**When** the user selects a single source other than Hacker News (e.g. Dev.to)
**Then** the Topics filter controls remain enabled
**And** topic selections continue to filter the feed as before

### Scenario 6: Previously selected topics are preserved while disabled
**Given** the user has one or more topics selected and then narrows the source filter to Hacker News only
**Then** the Topics filter controls become disabled, and the selected topics remain visually indicated as selected but are not applied when computing the visible Hacker News articles (so the feed shows all matching Hacker News articles rather than an empty list)
**And** when the user subsequently broadens the source selection again, those same topics automatically resume filtering the feed without the user needing to reselect them

## Acceptance Criteria

### Core Functionality
- The Topics filter controls are disabled (non-interactive) whenever the selected sources are exactly `['hackernews']`, and enabled in every other source-selection state (zero sources selected, Hacker News plus one or more other sources, or any single non-Hacker-News source).
- While Topics is disabled, the feed is filtered only by the selected source(s); any previously selected topics are not applied to the article filtering logic, so Hacker News articles are not incorrectly filtered down to zero results.
- Previously selected topics are retained in state (not cleared) while Topics is disabled, and automatically resume being applied to the feed filtering as soon as the source selection changes such that Topics becomes enabled again.
- The disabled/enabled state re-evaluates immediately on every source selection change, with no extra user action required to refresh it.

### Input Validation
- The disabled condition is based solely on the resolved set of selected sources being exactly Hacker News and nothing else; it does not depend on which (if any) topics are currently selected.
- Selecting zero sources (the "all sources" state) always results in Topics being enabled, regardless of prior state.

### User Experience
- When disabled, each Topics filter control is visually distinguished from its enabled state (e.g. reduced opacity, disabled cursor) so the user can tell at a glance that topic filtering is unavailable, consistent with how other disabled controls in the filters bar appear (e.g. the "Clear filters" button).
- Disabled Topics controls do not respond to click/keyboard activation and do not toggle their pressed/selected state while disabled.
- Topics controls that were selected before becoming disabled continue to show their selected visual state while disabled, so the user can see which topics will resume filtering once re-enabled.
- No separate error message or notice is required to explain the disabled state; the disabled appearance itself is sufficient feedback.

### Security & Access Control
- Not applicable — this change is purely client-side filter-UI behavior and introduces no new data access, authentication, or authorization concerns.

### Data Integrity
- Disabling and re-enabling the Topics filter never mutates or discards the user's selected source filters.
- Disabling Topics never clears the user's previously selected topics; they are only excluded from the active filtering computation while disabled, not removed from state.

### Error Handling
- No new error states are introduced by this change; the feed continues to rely on existing per-source and full-feed failure handling independent of the Topics enabled/disabled state.

### Performance & Sustainability / Green Code
- Recomputing the enabled/disabled state and the filtered article list on source-selection change is a lightweight, synchronous, client-side operation that does not trigger any additional network requests or re-fetch of the feed.

## Prerequisites
- [Aggregated news feed](./aggregated-news-feed-user-story.md) — this story refines the existing Topics and Source filtering behavior defined there.
