# 📰 Personal Developer News Portal

A privacy-first, zero-backend developer news aggregator built with **Angular 22** and **IndexedDB**. 

This application aggregates tech news in real time across 5 distinct APIs and normalizes them into a unified feed. Articles can be saved to a local browser database without requiring external account creation or server-side persistence.

---

## ✨ Features

- **Multi-Source Real-Time Aggregation:** Fetches content on load from 5 developer APIs:
  - **Dev.to REST API:** Topics covering AI, .NET, Angular, Testing, Azure, Anthropic, Claude, and GitHub.
  - **Microsoft Learn API/RSS:** AI Certification paths (Foundry, Work IQ, AI Search, Speech, Language, Agents, Agent Framework) and .NET SDKs.
  - **Hacker News (Algolia API):** Real-time top tech stories matching core topic tags.
  - **Hashnode GraphQL API:** Community developer articles matching topic tags.
  - **GitHub Search API:** Recently trending repositories matching core topics.
- **Unified Data Schema:** Maps diverse API payloads into a consistent `UnifiedArticle` UI contract.
- **Agentic Workflow:** It uses 6 different agents to implement each feature: User Story Writer, Spec Writer, TDD Test First (Red Cases), TDD Implementation and Implementation Validator.
- **Offline Favorites Storage:** Uses **Dexie.js (IndexedDB)** for local, in-browser persistence of saved articles.
- **Modern Angular Architecture:** Built entirely with Angular 22 Standalone Components, Signal-driven state, and strict typing.
- **Automated CI/CD Pipeline:** Includes GitHub Actions for automated linting, headless unit testing, and production builds.

---

## 🛠 Tech Stack

- **Framework:** Angular 22 (Standalone Components)
- **Database:** IndexedDB via [Dexie.js](https://dexie.org/)
- **Styling:** Tailwind CSS
- **CI/CD:** GitHub Actions (`.github/workflows/ci.yml`)
- **Testing:** Jasmine & Karma (Headless Chrome)

---

## 🚀 Getting Started

### Prerequisites

- **Node.js:** v20.x or higher
- **npm:** v10.x or higher
- **Angular CLI:** v22.x 

### Installation

1. Clone the repository:
   git clone https://github.com/your-username/dev-news.git
   cd dev-news-portal

2. Install dependencies:
   npm install

3. Start the development server:
   npm start
   
   Navigate to http://localhost:4200/ in your browser.

---

## 🧪 Testing & CI/CD

Run the unit test suite locally:
npm test

To execute tests headlessly (as configured in the GitHub Actions pipeline):
ng test --no-watch --no-progress --browsers=ChromeHeadless

To verify the production build:
npm run build

---

## 🤖 Multi-Agent Workspace Setup

This project was developed using an agentic workflow in GitHub Copilot Workspace.

### Directory Structure for Agents

.
├── .github/
│   ├── copilot-instructions.md   # Global architecture & commit rules
│   └── workflows/
│       └── ci.yml               # GitHub Actions CI configuration
└── docs/
    └── PRODUCT_SPEC.md          # Generated product specifications


### Agent Model Assignment Strategy
- **Claude Sonnet 5 (High Thinking Effort):** Product Specifications, Architecture, Data Layer, and API Normalization.
- **GPT-5.6 Terra (Medium Thinking Effort):** UI Components, State Streams, Unit Tests, and CI Workflow.
- **GPT-5.6 Luna (Low Thinking Effort):** Atomic Git Commit formatting and execution.

### Pending

- **Fix Github and Hashnode feeds:** No articles found.
- **Fix MSLearn filters:** MSLearn Feed shows articles but nothing when a filter is applied.
- Individual favorite cards should look like the ones in the News Feed (Tailwind).


---