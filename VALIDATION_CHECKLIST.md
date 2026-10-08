# Submission Checklist

## Verified by Actual Execution

Results from running the commands below in this project (Node.js v21.7.3, Cucumber 9.6.0,
Playwright; UI tests against the live https://emicalculator.net/; SQL against MySQL 8.0.43).

- [x] `npm run test:api` – 26/26 scenarios, 86/86 steps passed (API server started with `npm run start:api`, port 3000)
- [x] `npm run test:ui` – 3/3 scenarios, 34/34 steps passed, with no API server running
- [x] `npm test` – 29/29 scenarios, 120/120 steps passed (API server running on port 3000)
- [x] API server starts on port 3000 with `npm run start:api` without setting `PORT`, and `/health` returns 200
- [x] Home Loan A: displayed EMI ₹33,038 matches the independently calculated EMI; pie chart values > 0
- [x] Home Loan B: displayed EMI ₹46,351 matches the independently calculated EMI; pie chart values > 0
- [x] Personal Loan: sliders set 10L / 12% / 5 yrs, calendar set to Jan 2027, EMI ₹22,244 matches the independent calculation, 5 bars, 2027 Principal tooltip matches the chart data
- [x] B4 Scenario 1 (`database/transaction-matching.sql`, MySQL 8.0.43) – exactly 3 pairs: Alice Johnson → Bob Smith (10000.00 / 9500.00, 5.00%, 8.50 h / 510 min), Charlie Brown → Diana Prince (5000.00 / 5200.00, 4.00%, 2.75 h / 165 min), Diana Prince → Eve Wilson (20000.00 / 18500.00, 7.50%, 12.25 h / 735 min)
- [x] B4 Scenario 2 (`database/ipl-streak.sql`, MySQL 8.0.43) – KL Rahul 5, Shreyas Iyer 4, David Warner 3, Virat Kohli 3 consecutive 30+ matches, all starting 2024-03-22

## Present but Not Executed / Not Verified

- [ ] `src/pages/BrokenLocators.ts` – `compareLocators()` has not been run; the file is compile-only reference material
- [ ] `run-api-tests.ps1` / `run-api-tests.sh` – helper scripts not run since their last changes
- [ ] Changes made after the verified runs above (debug-trace removal in `api-server/src/routes/orders.ts`, documentation updates) – re-run `npm test` before submission

## Before Submitting

- [ ] `npm install` and `cd api-server && npm install && npm run build` on a fresh clone
- [ ] Start the API (`npm run start:api`), then run `npm test`
- [ ] Confirm `git status` shows no generated reports, logs or `dist/` output
