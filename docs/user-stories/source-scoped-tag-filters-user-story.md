# As a developer user, I want the Topics filter to only show tags relevant to my selected Sources so that I don't see topic options that don't apply to the content I'm viewing

## Description
The Topics filter currently always lists the union of every tag defined across all sources (Dev.to/Hacker News, Microsoft Learn, and GitHub), regardless of which Sources the user has selected. This makes the Topics list cluttered with tags that can never match any article in the currently visible feed — for example, GitHub-only tags remain selectable even when GitHub is deselected. This story scopes the Topics list to the tag set(s) belonging to the currently selected Source(s), so the available topics always reflect what could actually appear in the feed. When multiple Sources are selected, the Topics list shows the combined (deduplicated) set of tags across those Sources. When no Source is selected (the "all sources" state), the Topics list shows the full union of all tags, matching today's behavior.

## Scenario

### Scenario 1: Selecting a single source scopes the Topics list
**Given** the user is viewing the aggregated feed with no source filter selected
**When** the user selects GitHub as the only source
**Then** the Topics filter shows only the tags associated with GitHub
**And** tags that belong exclusively to Dev.to/Hacker News or Microsoft Learn are no longer shown as selectable Topics options

### Scenario 2: Selecting Dev.to or Hacker News shows the same tag set
**Given** no source filter is currently selected
**When** the user selects Dev.to as the only source
**Then** the Topics filter shows the Dev.to/Hacker News tag set
**And** selecting Hacker News instead of (or in addition to) Dev.to shows that same tag set, since both sources share one tag taxonomy

### Scenario 3: Selecting multiple sources shows the union of their tag sets
**Given** no source filter is currently selected
**When** the user selects both Microsoft Learn and GitHub as sources
**Then** the Topics filter shows the combined set of tags from Microsoft Learn and GitHub
**And** any tag present in both sources' tag sets appears only once in the Topics list, regardless of letter case differences between the two sources' definitions

### Scenario 4: Deselecting all sources restores the full tag list
**Given** one or more sources are selected and the Topics list is scoped accordingly
**When** the user deselects all sources, leaving zero sources selected ("all sources")
**Then** the Topics filter shows the full union of every tag across all sources, matching the default/no-filter behavior

### Scenario 5: Narrowing the source selection removes now-irrelevant selected topics from the active filter
**Given** the user has selected a topic that only exists in GitHub's tag set, while GitHub is among the selected sources
**When** the user deselects GitHub such that no remaining selected source includes that topic in its tag set
**Then** that topic is no longer shown as an available Topics option
**And** the feed is no longer filtered by that topic, since it can no longer be selected for the current source scope

### Scenario 6: Source change while Topics filtering is disabled
**Given** the selected sources are such that the Topics filter is currently disabled (per the existing "untaggable sources" rule)
**When** the user changes the source selection so that Topics becomes enabled again
**Then** the Topics list shown reflects the tag set(s) of the newly selected source(s) (or the full union, if zero sources are selected) at the moment it re-enables

## Acceptance Criteria

### Core Functionality
- The set of Topics shown is derived from the currently selected Source(s): Dev.to and Hacker News map to the Dev.to/Hacker News tag set, Microsoft Learn maps to the Microsoft Learn tag set, and GitHub maps to the GitHub tag set.
- When exactly one source (or multiple sources that share the same tag set, e.g. Dev.to and Hacker News together) is selected, only that source's tag set is shown.
- When multiple selected sources map to different tag sets, the Topics list shows the union of those tag sets.
- When zero sources are selected, the Topics list shows the union of all tag sets (unchanged from current/default behavior).
- The Topics list recomputes immediately whenever the source selection changes, with no extra user action required.

### Input Validation
- Tag matching for determining duplicates in the union is case-insensitive (e.g. two sources' tag sets containing "C#" and "c#" count as the same tag and are shown once).
- The displayed casing/label for a deduplicated tag is stable and consistent (the same tag is not shown with flickering or inconsistent casing across re-renders of the same source selection).
- A Source with no mapped tag set defined does not cause an error; it simply contributes no tags to the shown Topics list.

### User Experience
- Topics that are no longer part of the scoped tag set are removed from the visible filter controls entirely (not merely disabled), so the user isn't shown stale, inapplicable options.
- If a previously selected topic falls outside the newly scoped tag set after a source change, it is deselected from the active filter and no longer visually indicated as selected, so the user isn't left thinking a no-longer-visible topic is still being applied.
- Topics that remain valid under the new source scope keep their selected state across a source selection change (the user doesn't have to reselect topics that still apply).
- This scoping behavior does not alter or conflict with the existing rule that disables the Topics filter entirely when all selected sources are untaggable; scoping only determines which topics are listed when Topics is enabled.

### Security & Access Control
- Not applicable — this change is purely client-side filter-UI behavior and introduces no new data access, authentication, or authorization concerns.

### Data Integrity
- Changing the scoped Topics list never mutates the underlying tag set constants for any source; scoping only affects what is displayed and selectable.
- Deselecting a now out-of-scope topic as described in these criteria only affects the active topic filter selection, not the user's selected Source filters.

### Error Handling
- No new error states are introduced by this change; if a source selection results in an empty combined tag set (not expected given current tag definitions, but not assumed impossible), the Topics filter simply shows no options rather than erroring.

### Performance & Sustainability / Green Code
- Recomputing the scoped/deduplicated Topics list on every source selection change is a lightweight, synchronous, client-side operation that triggers no additional network requests or feed re-fetch.

## Prerequisites
- [Aggregated news feed](./aggregated-news-feed-user-story.md) — this story refines the existing Source and Topics filtering behavior defined there.
- [Hacker News tag filter disable](./hackernews-tag-filter-disable-user-story.md) — this story's scoping behavior must coexist with the existing rule that disables the Topics filter when all selected sources are untaggable.
