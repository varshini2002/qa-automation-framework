# Setup and Execution Guide

## Prerequisites

- **Node.js** 20+ and **npm**
- **Internet access** for the UI tests (they run against https://emicalculator.net/)
- **MySQL** only if you want to run the SQL scripts in `database/`

## Installation

```bash
cd qa-automation-framework

# Test framework dependencies (Cucumber, Playwright, TypeScript, ts-node, dotenv)
npm install

# Browser used by the UI tests
npx playwright install chromium

# API server dependencies and build (creates api-server/dist)
cd api-server
npm install
npm run build
cd ..
```

### Optional: Environment Overrides

```bash
cp config/.env.example .env
```

The variables the code actually reads:

| Variable | Read by | Default |
|----------|---------|---------|
| `BASE_URL` | UI navigation step | `https://emicalculator.net/` |
| `API_BASE_URL` | API client (`src/api/client.ts`) | `http://localhost:3000` |
| `PORT` | API server (`api-server/src/server.ts`) | `3000` |

## Running Tests

### Start the API Server (needed for API tests and `npm test`)

```bash
npm run start:api     # compiled server: api-server/dist/server.js (run the build first)
npm run dev:api       # TypeScript source via ts-node
```

The API listens on `http://localhost:3000`. Check it with:

```bash
curl http://localhost:3000/health
```

### Test Commands

| Command | Runs | API server needed? |
|---------|------|--------------------|
| `npm test` | All features in `src/features` (API + UI) | Yes |
| `npm run test:api` | `src/features/api` (products.feature, orders.feature) | Yes |
| `npm run test:ui` | `src/features/ui` (home-loan.feature, personal-loan.feature) | No |

The UI tests launch Chromium headless.

`run-api-tests.ps1` (PowerShell) and `run-api-tests.sh` (bash) build the API server if
`api-server/dist` is missing, start it on port 3000, wait for `/health`, run `npm run test:api`,
stop the server and exit with the test result.

### Run a Specific Feature or Scenario

```bash
npx cucumber-js src/features/ui/home-loan.feature
npx cucumber-js src/features/ui/home-loan.feature --name "Scenario A"
```

## Project Structure

```
qa-automation-framework/
├── src/
│   ├── pages/
│   │   ├── BasePage.ts            # Shared page helpers
│   │   ├── HomeLoanPage.ts        # Home Loan page object
│   │   ├── PersonalLoanPage.ts    # Personal Loan page object
│   │   └── BrokenLocators.ts      # B5 reference examples (not used by tests)
│   ├── features/
│   │   ├── ui/                    # home-loan.feature, personal-loan.feature
│   │   └── api/                   # products.feature, orders.feature (tagged @api)
│   ├── steps/
│   │   ├── hooks.ts               # API client setup/teardown
│   │   ├── ui/                    # common.steps.ts (browser hooks, navigation), home-loan, personal-loan
│   │   └── api/                   # common-api, products, orders steps
│   ├── api/client.ts              # API client (Playwright APIRequestContext)
│   └── utils/
│       ├── config.ts              # Environment configuration
│       └── calculator.ts          # Independent EMI calculation, amount parsing
├── api-server/
│   ├── src/
│   │   ├── server.ts              # App, /health, 404 + error handlers
│   │   ├── routes/products.ts     # GET /api/products
│   │   ├── routes/orders.ts       # GET /api/orders, POST /api/orders
│   │   ├── middleware/error-handler.ts
│   │   └── data/mock-data.json
│   ├── package.json               # build, start, dev
│   └── tsconfig.json
├── database/                      # schema.sql, sample-data.sql, transaction-matching.sql, ipl-streak.sql
├── docs/                          # AI_SELF_HEALING.md, ARCHITECTURE.md, SETUP.md
├── reports/                       # html-reports/ (Cucumber HTML report), logs/, screenshots/
├── config/.env.example
├── cucumber.js                    # Step files, ts-node, formatters
├── run-api-tests.ps1 / .sh
├── package.json
└── tsconfig.json
```

## Common Tasks

### View the Test Report

Every run writes `reports/html-reports/cucumber-report.html`:

```bash
start reports/html-reports/cucumber-report.html    # Windows
open reports/html-reports/cucumber-report.html     # macOS
```

`reports/logs/` and `reports/screenshots/` are kept as empty folders; the current suite does not
write to them.

### Add a Test Scenario

1. Add or edit a `.feature` file under `src/features/ui/` or `src/features/api/`
   (API features must keep the `@api` tag).
2. Implement new steps in `src/steps/ui/` or `src/steps/api/`.
3. For UI tests, add locators and actions to the page object, using selectors taken from the live DOM.
4. Run `npm run test:ui` or `npm run test:api` (start the API server first for API tests).

### Add an API Endpoint

1. Add a route in `api-server/src/routes/` and register it in `api-server/src/server.ts`.
2. Add any data to `api-server/src/data/mock-data.json`.
3. Rebuild: `cd api-server && npm run build`.
4. Add an `@api` feature and steps, then run `npm run test:api` with the server running.

## Troubleshooting

### API tests fail with ECONNREFUSED
The API server is not running. Start it with `npm run start:api` (build it first) or `npm run dev:api`.

### Port 3000 already in use
```bash
lsof -i :3000                  # macOS/Linux
netstat -ano | findstr :3000   # Windows

kill -9 <PID>                  # macOS/Linux
taskkill /PID <PID> /F         # Windows
```

### `npm run start:api` cannot find dist/server.js
```bash
cd api-server && npm run build
```

### Browser not installed
```bash
npx playwright install chromium
```

### TypeScript errors
```bash
npx tsc --noEmit
```

### UI tests time out
Check internet access to https://emicalculator.net/.

## Additional Resources

- [Playwright documentation](https://playwright.dev)
- [Cucumber documentation](https://cucumber.io/docs/cucumber/)
- [ARCHITECTURE.md](ARCHITECTURE.md) – technical design
- [AI_SELF_HEALING.md](AI_SELF_HEALING.md) – locator repair approach (B5)
