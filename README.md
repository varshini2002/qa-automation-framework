# QA Automation Assessment – Section B Implementation

Cucumber + Playwright + TypeScript framework covering a custom REST API and its API tests, UI
automation of https://emicalculator.net/, SQL queries, and an AI-assisted locator repair exercise.

## Project Overview

- **B1 – Custom API**: Express + TypeScript mock API with 3 endpoints (50 products, 50 orders in memory)
- **B2 – API Automation**: Cucumber scenarios using Playwright `APIRequestContext`
- **B3 – UI Automation**: EMI Calculator (Home Loan A & B, Personal Loan) with page objects
- **B4 – SQL**: Transaction matching and IPL player streak queries
- **B5 – AI Self-Healing**: Documented AI-assisted repair of brittle locators, with real examples

See [DELIVERABLES.md](DELIVERABLES.md) for the per-item breakdown and
[VALIDATION_CHECKLIST.md](VALIDATION_CHECKLIST.md) for what has been verified.

## Project Structure

```
qa-automation-framework/
├── api-server/                    # B1 – Express API (port 3000)
│   ├── src/
│   │   ├── server.ts              # App setup, /health, 404 + error handlers
│   │   ├── routes/products.ts     # GET /api/products
│   │   ├── routes/orders.ts       # GET /api/orders, POST /api/orders
│   │   ├── middleware/error-handler.ts
│   │   └── data/mock-data.json
│   └── package.json               # build (tsc), start (node dist/server.js), dev (ts-node)
├── src/
│   ├── api/client.ts              # B2 – API client (Playwright APIRequestContext)
│   ├── features/
│   │   ├── api/                   # products.feature, orders.feature (tagged @api)
│   │   └── ui/                    # home-loan.feature, personal-loan.feature
│   ├── steps/
│   │   ├── hooks.ts               # API client setup/teardown
│   │   ├── api/                   # API step definitions
│   │   └── ui/                    # UI step definitions + browser hooks
│   ├── pages/
│   │   ├── BasePage.ts
│   │   ├── HomeLoanPage.ts        # B3 page objects
│   │   ├── PersonalLoanPage.ts
│   │   └── BrokenLocators.ts      # B5 reference examples (not a page object, not used by tests)
│   └── utils/
│       ├── config.ts              # BASE_URL, API_BASE_URL, ...
│       └── calculator.ts          # Independent EMI calculation, amount parsing ("25L")
├── database/                      # B4 – schema, sample data, queries
├── docs/                          # ARCHITECTURE.md, SETUP.md, AI_SELF_HEALING.md
├── config/.env.example            # Environment variable template
├── reports/                       # html-reports/, logs/, screenshots/ (generated content is git-ignored)
├── cucumber.js                    # Cucumber config (step files, ts-node, formatters)
├── run-api-tests.ps1 / .sh        # Helper: start API, run API tests, stop API
└── package.json
```

## Getting Started (Fresh Clone)

Prerequisites: Node.js 20+ and npm, plus internet access for the UI tests.

```bash
# 1. Test framework dependencies
npm install
npx playwright install chromium

# 2. API server dependencies and build
cd api-server
npm install
npm run build
cd ..

# 3. Optional: environment overrides
cp config/.env.example .env
```

## Running the Tests

| Command | Runs | Needs the API server? |
|---------|------|----------------------|
| `npm test` | All features under `src/features` (API + UI) | **Yes** – port 3000 |
| `npm run test:api` | `src/features/api` | **Yes** – port 3000 |
| `npm run test:ui` | `src/features/ui` | No (needs internet access to emicalculator.net) |

Start the API server in a separate terminal first:

```bash
# Terminal 1 – API server on http://localhost:3000
npm run start:api          # runs the compiled server (api-server/dist), build it first
# or: npm run dev:api      # runs the TypeScript source with ts-node

# Terminal 2
npm test
```

Stop the server with Ctrl+C when finished. Alternatively, `run-api-tests.ps1` (PowerShell) or
`run-api-tests.sh` (bash) builds the API if `api-server/dist` is missing, starts it on port 3000,
waits for `/health`, runs `npm run test:api`, stops the server and exits with the test result.

### Verified Baseline

| Command | Scenarios | Steps |
|---------|-----------|-------|
| `npm run test:api` | 26/26 passed | 86/86 passed |
| `npm run test:ui` | 3/3 passed | 34/34 passed |
| `npm test` | 29/29 passed | 120/120 passed |

## B1 – API Endpoints

Base URL `http://localhost:3000` (override the server port with `PORT`, and the test client's
target with `API_BASE_URL`).

| Method | Path | Parameters / body |
|--------|------|-------------------|
| GET | `/api/products` | `page`, `limit` (1–100), `category`, `search`, `sort`, `minPrice`, `maxPrice` |
| GET | `/api/orders` | `page`, `limit` (1–100), `status` (`pending`, `shipped`, `completed`, `cancelled`), `userId` |
| POST | `/api/orders` | JSON body `{ "userId": 110, "productId": 3, "quantity": 2 }` |

`GET /health` is a server health check.

Responses use `{ "success": true, "data": ..., "pagination": {...} }` for lists,
`{ "success": true, "data": {...} }` with **201** for a created order, and
`{ "success": false, "error": "..." }` for errors – **400** for validation errors (e.g.
`Missing required field: userId`, `Invalid quantity`, `Insufficient stock`) and **404** for an
unknown product (`Product with id 9999 not found`).

```bash
curl "http://localhost:3000/api/products?category=electronics&sort=price&limit=5"
curl "http://localhost:3000/api/orders?status=completed&page=1&limit=10"
```

## B2 – API Automation

`src/api/client.ts` wraps Playwright's `APIRequestContext`; its base URL comes from
`config.apiBaseURL` (`API_BASE_URL`, default `http://localhost:3000`). The API features are tagged
`@api`, and the hook that pre-loads product data runs only for `@api` scenarios, so UI runs never
call the API.

- `products.feature` – 11 scenarios (pagination, filtering, sorting, search, validation errors)
- `orders.feature` – 15 scenarios (listing, filtering, order creation, validation and not-found errors)

## B3 – UI Automation

Page objects in `src/pages`, step definitions in `src/steps/ui`. All locators come from the live
DOM of emicalculator.net:

- **Calculator fields:** `#loanamount`, `#loaninterest`, `#loanterm`; product tabs `#home-loan > a`
  and `#personal-loan > a`, with the active product read from `#loanproduct`.
- **No Calculate button:** the site recalculates asynchronously when a field is committed, so each
  action waits for the resulting `#emiamount` re-render (no fixed waits).
- **Sliders (Personal Loan):** `#loanamountslider`, `#loaninterestslider` and `#loantermslider`
  are dragged with the real mouse. The site ignores programmatic slider changes.
- **Calendar:** `#startmonthyear` (Bootstrap Datepicker, month view) sets the schedule start month.
- **Charts:** Highcharts SVGs in `#emipiechart` and `#emibarchart`. Values come from the chart
  bound to each container and are cross-checked against the rendered labels or tooltip.
- **EMI check:** the displayed EMI is compared with an EMI calculated independently in
  `src/utils/calculator.ts` from the values read back from the form.

| Scenario | Inputs | Checks |
|----------|--------|--------|
| Home Loan A | 25L, 10%, 10 yrs | EMI vs. independent calculation; pie principal/interest > 0 |
| Home Loan B | 50L, 7.5%, 15 yrs | Same as A |
| Personal Loan | Sliders: 10L, 12%, 5 yrs; calendar: Jan 2027 | EMI vs. independent calculation; bar count = chart years; 2027 Principal tooltip: Year = 2027, value > 0 and equal to the chart data |

## B4 – SQL

| File | Content |
|------|---------|
| `database/schema.sql` | Tables for both scenarios |
| `database/sample-data.sql` | Sample data |
| `database/transaction-matching.sql` | Transactions where A pays B and B pays a similar amount back within 24 hours |
| `database/ipl-streak.sql` | Players scoring 30+ runs in at least 3 consecutive matches (window functions) |

The scripts do not create or select a database, so pass the database name to `mysql`
(replace `qa_assessment` with your database; load the sample data into empty tables):

```bash
mysql -u root -p qa_assessment < database/schema.sql
mysql -u root -p qa_assessment < database/sample-data.sql
mysql -u root -p --table qa_assessment < database/transaction-matching.sql
mysql -u root -p --table qa_assessment < database/ipl-streak.sql
```

In PowerShell, which has no `<` redirection, use
`mysql -u root -p --table qa_assessment -e "source database/transaction-matching.sql"` (same for the other files).

Both scenarios were executed successfully against **MySQL 8.0.43**:

**Scenario 1 – transaction matching** (exactly 3 pairs)

| Account A | Account B | Forward | Return | Difference | Time difference |
|-----------|-----------|---------|--------|------------|-----------------|
| Alice Johnson | Bob Smith | 10000.00 | 9500.00 | 5.00% | 8.50 h / 510 min |
| Charlie Brown | Diana Prince | 5000.00 | 5200.00 | 4.00% | 2.75 h / 165 min |
| Diana Prince | Eve Wilson | 20000.00 | 18500.00 | 7.50% | 12.25 h / 735 min |

**Scenario 2 – IPL 30+ run streaks** (3+ consecutive matches)

| Player | Consecutive matches | Streak start |
|--------|---------------------|--------------|
| KL Rahul | 5 | 2024-03-22 |
| Shreyas Iyer | 4 | 2024-03-22 |
| David Warner | 3 | 2024-03-22 |
| Virat Kohli | 3 | 2024-03-22 |

## B5 – AI Self-Healing

[docs/AI_SELF_HEALING.md](docs/AI_SELF_HEALING.md) describes the AI-assisted workflow used to
detect and repair brittle locators. [src/pages/BrokenLocators.ts](src/pages/BrokenLocators.ts)
lists five real brittle locators from this project (for example the non-existent Calculate button
and a positional tenure selector) with the repaired strategies now used by the page objects.
This is a documented repair process, not runtime self-healing.

## Configuration

| Variable | Used by | Default |
|----------|---------|---------|
| `BASE_URL` | UI tests (`Given I navigate to the EMI Calculator application`) | `https://emicalculator.net/` |
| `API_BASE_URL` | API client | `http://localhost:3000` |
| `PORT` | API server | `3000` |

Values can be set in a root `.env` file (see `config/.env.example`). The UI browser is launched
headless.

## Reports

Each run writes an HTML report to `reports/html-reports/cucumber-report.html` (git-ignored).

## Troubleshooting

- **API tests fail with `ECONNREFUSED`** – start the API server (`npm run start:api`) and check
  that port 3000 is free: `netstat -ano | findstr :3000` (Windows) or `lsof -i :3000`.
- **`npm run start:api` cannot find `dist/server.js`** – build it: `cd api-server && npm run build`.
- **UI tests fail to launch a browser** – run `npx playwright install chromium`.
- **UI tests time out** – they need internet access to emicalculator.net.

## Documentation

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) – design notes
- [docs/SETUP.md](docs/SETUP.md) – detailed setup
- [docs/AI_SELF_HEALING.md](docs/AI_SELF_HEALING.md) – B5 write-up
- [DELIVERABLES.md](DELIVERABLES.md) – deliverables per Section B item
- [VALIDATION_CHECKLIST.md](VALIDATION_CHECKLIST.md) – verified vs. not-yet-verified items
