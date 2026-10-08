# Technical Architecture

## Overview

A Cucumber + Playwright + TypeScript framework with three test targets: a custom Express API
(API tests), the live EMI Calculator at https://emicalculator.net/ (UI tests), and SQL scripts.
All Cucumber scenarios run through one configuration (`cucumber.js`).

## System Components

### 1. UI Testing Layer (Playwright + Cucumber)

**Page objects** (`src/pages/`)
- `BasePage.ts` – shared helpers (navigation, click, fill, text, screenshot)
- `HomeLoanPage.ts` – Home Loan fields, EMI result and pie chart
- `PersonalLoanPage.ts` – Personal Loan sliders, schedule calendar, EMI result and bar chart
- `BrokenLocators.ts` – B5 reference examples of brittle locators and their repairs; not a page
  object and not used by any test

**Feature files** (`src/features/ui/`)
- `home-loan.feature` – Scenario A (25L / 10% / 10 yrs) and Scenario B (50L / 7.5% / 15 yrs)
- `personal-loan.feature` – sliders, calendar widget, bar chart and tooltip

**Step definitions** (`src/steps/ui/`)
- `common.steps.ts` – browser launch/close hooks (headless Chromium), navigation, EMI comparison
  and pie chart steps
- `home-loan.steps.ts`, `personal-loan.steps.ts` – scenario-specific steps

**Locator strategy**
- Selectors are taken from the live DOM: element ids (`#loanamount`, `#loaninterest`,
  `#loanterm`, `#emiamount`, `#startmonthyear`), tab ids (`#home-loan > a`, `#personal-loan > a`),
  and the Highcharts structure scoped to `#emipiechart` / `#emibarchart`.
- No positional selectors, broad text selectors, `force` clicks or fixed waits.
- The site has no Calculate button and recalculates asynchronously; each action waits for the
  `#emiamount` re-render it triggers.
- Chart values are read from the Highcharts chart bound to each container and cross-checked
  against the rendered labels/tooltip.

### 2. API Testing Layer (Playwright APIRequestContext + Cucumber)

- **API client** (`src/api/client.ts`) – wraps `APIRequestContext`; base URL from
  `config.apiBaseURL`; methods `get`, `post`, `put`, `delete` plus product/order helpers.
- **Feature files** (`src/features/api/`, tagged `@api`) – `products.feature` (11 scenarios) and
  `orders.feature` (15 scenarios).
- **Step definitions** (`src/steps/api/`) – `common-api.steps.ts`, `products.steps.ts`,
  `orders.steps.ts`; `src/steps/hooks.ts` creates and disposes the API client per scenario. The
  hook that pre-loads product data is limited to `@api` scenarios.

### 3. Custom API Server (Express)

**Location:** `api-server/` (port 3000 by default; `PORT` overrides)

| Method | Path | Notes |
|--------|------|-------|
| GET | `/api/products` | Pagination, category/search/price filters, sorting |
| GET | `/api/orders` | Pagination, status/userId filters |
| POST | `/api/orders` | Validates userId/productId/quantity and stock |
| GET | `/health` | Health check |

In-memory mock data (`api-server/src/data/mock-data.json`), error-handling middleware, and
400/404/500 responses in the form `{ "success": false, "error": "..." }`.

### 4. SQL (`database/`)

- `schema.sql` – tables for accounts/transactions and IPL players/matches/batting stats
- `sample-data.sql` – sample data for both scenarios
- `transaction-matching.sql` – reciprocal transactions within 24 hours with a similar amount
- `ipl-streak.sql` – players with 30+ runs in 3+ consecutive matches

### 5. Utilities (`src/utils/`)

- `config.ts` – environment configuration via dotenv (`BASE_URL`, `API_BASE_URL`, ...)
- `calculator.ts` – independent EMI calculation and amount parsing ("25L" → 2500000), used to
  validate the EMI shown by the site

### 6. Reports

`reports/html-reports/cucumber-report.html` is written on every run by Cucumber's built-in HTML
formatter. `reports/logs/` and `reports/screenshots/` are kept as empty folders.

## Configuration Files

- `package.json` – dependencies and scripts (`test`, `test:api`, `test:ui`, `start:api`, `dev:api`)
- `cucumber.js` – step/hook files, ts-node, formatters (feature paths are passed by each script)
- `tsconfig.json` – TypeScript settings for the tests
- `api-server/package.json`, `api-server/tsconfig.json` – API server build (`tsc`), `start`, `dev`
- `config/.env.example` – environment template
- `run-api-tests.ps1` / `run-api-tests.sh` – start the API, run the API tests, stop the API

## Data Flow

```
                   Cucumber (cucumber.js)
                 ┌──────────┴──────────┐
          UI features              API features (@api)
                 │                       │
          UI step defs              API step defs
                 │                       │
    Page objects + calculator.ts    API client (client.ts)
                 │                       │
      emicalculator.net (live)    Express API (localhost:3000)
                 └──────────┬──────────┘
            reports/html-reports/cucumber-report.html
```

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Test runner | Cucumber.js 9 (with ts-node) |
| Browser and API automation | Playwright |
| Language | TypeScript |
| API server | Express |
| SQL | MySQL-dialect scripts |
| Reporting | Cucumber HTML formatter |
| Configuration | dotenv |
