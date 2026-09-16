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