# Project Deliverables – Section B

What this repository contains for each Section B item, and how each was verified.

## B1 – Custom API

Express + TypeScript mock API in `api-server/`, serving in-memory data (50 products, 50 orders)
from `api-server/src/data/mock-data.json`. Default port **3000** (`PORT` env var overrides).

Exactly three API endpoints:

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/products` | List products – `page`, `limit` (1–100), `category`, `search`, `sort`, `minPrice`, `maxPrice` |
| GET | `/api/orders` | List orders – `page`, `limit` (1–100), `status`, `userId` |
| POST | `/api/orders` | Create an order from `{ userId, productId, quantity }` |

Plus a `GET /health` server health check. Validation errors return 400, unknown products 404.

| File | Role |
|------|------|
| `api-server/src/server.ts` | App setup, routes, health check, 404 + error handlers |
| `api-server/src/routes/products.ts` | `GET /api/products` |
| `api-server/src/routes/orders.ts` | `GET /api/orders`, `POST /api/orders` |
| `api-server/src/middleware/error-handler.ts` | Error handler |
| `api-server/src/data/mock-data.json` | Mock data |

## B2 – API Automation

Cucumber + Playwright `APIRequestContext` tests against the B1 API.

| File | Role |
|------|------|
| `src/api/client.ts` | API client on Playwright `APIRequestContext`; base URL from `src/utils/config.ts` (`API_BASE_URL`, default `http://localhost:3000`) |
| `src/features/api/products.feature` | 11 scenarios |
| `src/features/api/orders.feature` | 15 scenarios |
| `src/steps/api/*.steps.ts`, `src/steps/hooks.ts` | Step definitions and hooks (API-only hook tagged `@api`) |

**Verified:** `npm run test:api` – **26/26 scenarios, 86/86 steps passed** (API server running on port 3000).

## B3 – EMI Calculator UI Automation

Cucumber + Playwright UI tests against https://emicalculator.net/, using page objects.

| Scenario | What it does |
|----------|--------------|
| Home Loan A | 25L / 10% / 10 yrs: enter values, verify displayed EMI against an independently calculated EMI, validate the Highcharts pie (principal and interest > 0, matching the rendered % labels) |
| Home Loan B | Same flow with 50L / 7.5% / 15 yrs |
| Personal Loan | Set 10L / 12% / 5 yrs by dragging the sliders, pick schedule start month Jan 2027 in the calendar widget, verify the EMI independently, count the bar chart bars, hover the 2027 Principal bar and validate its tooltip against the chart data |

| File | Role |
|------|------|
| `src/pages/HomeLoanPage.ts`, `src/pages/PersonalLoanPage.ts`, `src/pages/BasePage.ts` | Page objects |
| `src/features/ui/home-loan.feature`, `src/features/ui/personal-loan.feature` | 3 scenarios |
| `src/steps/ui/*.steps.ts` | Step definitions and browser hooks |
| `src/utils/calculator.ts` | Independent EMI calculation and amount parsing (e.g. "25L") |

**Verified:** `npm run test:ui` – **3/3 scenarios, 34/34 steps passed** (no API server needed).

## B4 – SQL

| File | Content |
|------|---------|
| `database/schema.sql` | Table definitions for both scenarios |
| `database/sample-data.sql` | Sample data |
| `database/transaction-matching.sql` | Scenario 1: transactions returned within 24 hours with a similar amount |
| `database/ipl-streak.sql` | Scenario 2: IPL players scoring 30+ runs in 3+ consecutive matches |

**Verified:** both scenarios executed successfully against **MySQL 8.0.43** (schema and sample data
loaded, then each query run).

Scenario 1 – `transaction-matching.sql` returned exactly 3 pairs:

| Account A | Account B | Forward amount | Return amount | Difference | Time difference |
|-----------|-----------|----------------|---------------|------------|-----------------|
| Alice Johnson | Bob Smith | 10000.00 | 9500.00 | 5.00% | 8.50 hours / 510 minutes |
| Charlie Brown | Diana Prince | 5000.00 | 5200.00 | 4.00% | 2.75 hours / 165 minutes |
| Diana Prince | Eve Wilson | 20000.00 | 18500.00 | 7.50% | 12.25 hours / 735 minutes |

Scenario 2 – `ipl-streak.sql` returned 4 players:

| Player | Consecutive matches (30+ runs) | Streak start |
|--------|-------------------------------|--------------|
| KL Rahul | 5 | 2024-03-22 |
| Shreyas Iyer | 4 | 2024-03-22 |
| David Warner | 3 | 2024-03-22 |
| Virat Kohli | 3 | 2024-03-22 |

## B5 – AI Self-Healing

| File | Content |
|------|---------|
| `docs/AI_SELF_HEALING.md` | AI-assisted locator repair workflow, prompt template, and the five repairs |
| `src/pages/BrokenLocators.ts` | Five real brittle locators from this project with their repaired strategies (reference only; not imported by tests) |

This is an AI-assisted repair process applied by hand, not runtime self-healing. The repaired
locators are the ones used by the B3 page objects, which pass in the verified UI run.

## Combined Run

**Verified:** `npm test` – **29/29 scenarios, 120/120 steps passed** (API server running on port 3000).

| Command | Scenarios | Steps |
|---------|-----------|-------|
| `npm run test:api` | 26 | 86 |
| `npm run test:ui` | 3 | 34 |
| `npm test` | 29 | 120 |
