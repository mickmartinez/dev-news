# Global Engineering Rules

## 1. Architecture & Framework
- **Stack:** Angular 22 (Strict Mode, Standalone Components only). No NgModules.
- **State & Storage:** Use Dexie.js (IndexedDB) exclusively for persisting the "Favorites" feature. Do not use LocalStorage. 
- **Data Fetching:** Do not cache the main news feed to disk. All news feeds must be fetched in real-time on component load.

## 2. Git Workflow (Strict Constraint)
- Every newly created or modified component, service, model, or unit test MUST be committed as a standalone, atomic commit. 
- You are strictly forbidden from batching multiple logical changes into a single commit.
- Use Conventional Commits format (e.g., `feat(ui): add article card component`). 
- Delegate git commit generation to the lightweight model (GPT-5.6 Luna) when possible.

## 3. Data Normalization
- All external API data must be mapped to a single `UnifiedArticle` interface before being passed to the UI layer. Do not pass raw API payloads to Angular components.

## 4. CI/CD & Automation
- Include a GitHub Actions workflow (`.github/workflows/ci.yml`) to build the project and execute all unit tests.
- Ensure all tests run headlessly (e.g., using Karma with ChromeHeadless or the native Angular 22 test runner) so the CI job succeeds without a GUI environment.

## 5. Mandatory Agent Delegation (Strict Constraint)
Every feature MUST be built through the following agent pipeline, in order. Do not hand-write
artifacts that a mandated agent is responsible for producing — invoke the agent instead.

1. **`user-story-writer`** — produces the user story and acceptance criteria in
   `docs/user-stories/` before any technical design begins.
2. **`spec-writer`** — produces the technical specification in `docs/specs/`, referencing the
   user story from step 1.
3. **`angular-model-generator`** — produces the TypeScript models/interfaces and Angular
   data-access services for the feature, following the spec from step 2.
4. Implementation (components, storage, wiring) proceeds against the approved spec.
5. **`implementation-validator`** — after implementation, validates the code against the
   technical spec and reports any gaps before the feature is considered done.
6. **Testing** — unit tests are produced via the TDD agent pair, not hand-written directly:
   - **`tdd-test-first`** writes the failing tests (Red phase).
   - **`tdd-implementation`** makes them pass (Green phase).

This pipeline applies to every feature, including retroactively revising any work completed
before this rule was added.
