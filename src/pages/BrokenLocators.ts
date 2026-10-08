import { Page } from '@playwright/test';

/**
 * B5 - AI self-healing demonstration: intentionally brittle locators and their repairs.
 *
 * NOT A PAGE OBJECT. Nothing in the test suite imports this file; the production page objects
 * (HomeLoanPage, PersonalLoanPage) use only the repaired strategies. Each entry records a brittle
 * locator that existed in (or was used against) this project for emicalculator.net, why it is
 * brittle, and the repair that was adopted after inspecting the live DOM with AI assistance.
 *
 * There is no runtime self-healing here: repairs were applied to the page objects by hand.
 * See docs/AI_SELF_HEALING.md.
 */
export interface LocatorRepair {
  id: string;
  element: string;
  brokenLocator: string;
  whyBrittle: string;
  repairedLocator: string;
  repairNotes: string;
  usedIn: string;
}

export const BROKEN_LOCATORS: LocatorRepair[] = [
  {
    id: 'calculate-button',
    element: 'Calculate button (Home Loan)',
    brokenLocator: 'button:has-text("Calculate")',
    whyBrittle:
      'Assumes a control that does not exist. The calculator form has no submit control; the site ' +
      'recalculates from each field\'s change handler. The old calculateEMI() failed with ' +
      '"Calculate button not found".',
    repairedLocator: '#emiamount span',
    repairNotes:
      'No click. Commit each field (fill + blur fires its change handler) and wait for the ' +
      '#emiamount re-render that the recalculation causes, then read the EMI from #emiamount span.',
    usedIn: 'HomeLoanPage.fillAndCommit() / waitForEmiRerender() / calculateEMI()',
  },
  {
    id: 'interest-rate-input',
    element: 'Interest rate input (read back in home-loan.steps.ts)',
    brokenLocator: 'input[aria-label*="interest" i], input[placeholder*="interest" i], input[name*="rate" i]',
    whyBrittle:
      'Guessed attributes. The live field is <input id="loaninterest" name="loaninterest"> with no ' +
      'aria-label or placeholder, and its name does not contain "rate".',
    repairedLocator: '#loaninterest',
    repairNotes: 'Use the field\'s own unique id from the live DOM.',
    usedIn: 'HomeLoanPage.interestRateInput(), home-loan.steps.ts',
  },
  {
    id: 'tenure-input',
    element: 'Loan tenure input',
    brokenLocator: 'input[type="text"] >> nth=2',
    whyBrittle:
      'Positional: picks "the third text input on the page". It only works while no text input is ' +
      'added before the tenure field anywhere on the page.',
    repairedLocator: '#loanterm',
    repairNotes:
      'Use the field id. Note name="loantenure" belongs to the Yr/Mo radio buttons, not this input.',
    usedIn: 'HomeLoanPage.tenureInput(), PersonalLoanPage.getFormValues(), home-loan.steps.ts',
  },
  {
    id: 'pie-chart-values',
    element: 'Pie chart principal / interest values',
    brokenLocator: '[data-testid="chart-value"], .chart-value, .pie-value, .chart-label',
    whyBrittle:
      'Guessed class names and test ids. The pie is a Highcharts SVG in #emipiechart; its slices are ' +
      '<path> elements and its labels only show percentages, so no element carries the amounts.',
    repairedLocator: '#emipiechart g.highcharts-series.highcharts-pie-series path.highcharts-point',
    repairNotes:
      'Assert the two rendered slices, read principal/interest from the Highcharts chart bound to ' +
      '#emipiechart (data-highcharts-chart), and cross-check them against the rendered % labels.',
    usedIn: 'HomeLoanPage.getPieChartValues()',
  },
  {
    id: 'bar-chart-bars',
    element: 'Bar chart bars of one series (Personal Loan)',
    brokenLocator: '#emibarchart g.highcharts-series-1.highcharts-column-series rect.highcharts-point',
    whyBrittle:
      'Over-matches: the legend item shares the highcharts-series-N / highcharts-column-series classes ' +
      'and contains a rect.highcharts-point swatch, so the count is one higher than the bars ' +
      '(observed 4 matches for 3 bars).',
    repairedLocator: '#emibarchart g.highcharts-series.highcharts-series-1.highcharts-column-series rect.highcharts-point',
    repairNotes:
      'Require the bare highcharts-series class, which only the plot-area series group has. The series ' +
      'index is resolved from the chart data by series name at runtime.',
    usedIn: 'PersonalLoanPage.countBars()',
  },
];

/**
 * Count how many elements each broken and repaired locator matches on the current page, for
 * comparing them side by side. Intended for a page already on https://emicalculator.net/
 * (default Home Loan view). Reports counts only; it does not repair or retry anything.
 */
export async function compareLocators(
  page: Page
): Promise<{ id: string; brokenMatches: number; repairedMatches: number }[]> {
  const results = [];
  for (const entry of BROKEN_LOCATORS) {
    results.push({
      id: entry.id,
      brokenMatches: await page.locator(entry.brokenLocator).count(),
      repairedMatches: await page.locator(entry.repairedLocator).count(),
    });
  }
  return results;
}
