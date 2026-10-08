import { When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { PersonalLoanPage } from '../../pages/PersonalLoanPage';
import { EMICalculator } from '../../utils/calculator';

// Values used by "I set tenure using calendar widget" (the feature step carries no parameters)
const TENURE_YEARS = 5;
const SCHEDULE_START = { month: 'Jan', year: 2027 };
// Bar whose tooltip is validated: the Principal column for the first schedule year
const TOOLTIP_SERIES = 'Principal';

/**
 * Select Personal Loan section
 */
When('I select Personal Loan', async function (this: any) {
  const personalLoanPage = new PersonalLoanPage(this.page);
  await personalLoanPage.selectPersonalLoan();
});

/**
 * Set loan amount by dragging the loan amount slider
 * Converts display format (e.g., "10L") to rupees (e.g., 1000000)
 */
When(/^I set loan amount to "([^"]*)" using slider$/, async function (this: any, amountDisplay: string) {
  const personalLoanPage = new PersonalLoanPage(this.page);
  await personalLoanPage.setLoanAmountWithSlider(EMICalculator.parseAmount(amountDisplay));
});

/**
 * Set interest rate by dragging the interest rate slider
 */
When(/^I set interest rate to "([^"]*)" using slider$/, async function (this: any, rate: string) {
  const personalLoanPage = new PersonalLoanPage(this.page);
  await personalLoanPage.setInterestRateWithSlider(Number(rate.replace('%', '').trim()));
});

/**
 * Set tenure with the tenure slider, then pick the schedule start month in the calendar widget.
 * The site's calendar (#startmonthyear) sets the month the EMI schedule starts from, not the tenure.
 */
When(/^I set tenure using calendar widget$/, async function (this: any) {
  const personalLoanPage = new PersonalLoanPage(this.page);

  await personalLoanPage.setTenureYearsWithSlider(TENURE_YEARS);
  await personalLoanPage.selectScheduleStartMonth(SCHEDULE_START.month, SCHEDULE_START.year);
  this.scheduleStartYear = String(SCHEDULE_START.year);
});

/**
 * Set tenure (in years) with the tenure slider
 */
When(/^I set tenure to "([^"]*)"$/, async function (this: any, tenure: string) {
  const personalLoanPage = new PersonalLoanPage(this.page);
  await personalLoanPage.setTenureYearsWithSlider(Number(tenure.replace(/[^\d.]/g, '')));
});

/**
 * The application recalculates on every slider/calendar change (there is no submit control);
 * each of those actions already waited for its recalculation. Verify the displayed EMI against
 * an EMI calculated independently from the values the form now holds.
 */
When('I submit the calculation', async function (this: any) {
  const personalLoanPage = new PersonalLoanPage(this.page);

  const { principal, annualRate, tenureYears } = await personalLoanPage.getFormValues();
  const expectedEMI = EMICalculator.calculateEMI(principal, annualRate, tenureYears);
  const displayedEMI = await personalLoanPage.getDisplayedEMI();
  console.log('[PERSONALLOAN.STEPS] Form values - principal:', principal, 'rate:', annualRate, 'tenure (years):', tenureYears,
    '| independent EMI:', expectedEMI, '| displayed EMI:', displayedEMI);

  expect(displayedEMI).toBeGreaterThan(0);
  // The site shows the EMI rounded to whole rupees
  expect(displayedEMI).toBe(Math.round(expectedEMI));
});

/**
 * Verify bar chart is visible
 */
Then('the bar chart should be visible', async function (this: any) {
  const personalLoanPage = new PersonalLoanPage(this.page);
  expect(await personalLoanPage.isBarChartVisible()).toBe(true);
});

/**
 * Verify bar chart contains one bar per schedule year, and more than one
 */
Then('the bar chart should contain multiple bars', async function (this: any) {
  const personalLoanPage = new PersonalLoanPage(this.page);

  const years = await personalLoanPage.getBarChartYears();
  const barCount = await personalLoanPage.countBars(TOOLTIP_SERIES);
  console.log('[PERSONALLOAN.STEPS] Bar chart years:', JSON.stringify(years), '| rendered bars:', barCount);

  expect(barCount).toBeGreaterThan(1);
  expect(barCount).toBe(years.length);
});

/**
 * Hover the Principal bar for the first schedule year and wait for its tooltip
 */
Then('I can hover over a bar to see tooltip', async function (this: any) {
  const personalLoanPage = new PersonalLoanPage(this.page);

  const year = this.scheduleStartYear;
  expect((await personalLoanPage.getBarChartYears())[0]).toBe(year);

  this.hoveredBar = { series: TOOLTIP_SERIES, year, chartValue: await personalLoanPage.hoverBar(TOOLTIP_SERIES, year) };
});

/**
 * Verify the tooltip shows the hovered year and a positive Principal matching the chart data
 */
Then(/^the tooltip value should be valid and greater than zero$/, async function (this: any) {
  const personalLoanPage = new PersonalLoanPage(this.page);
  const { series, year, chartValue } = this.hoveredBar;

  const tooltip = await personalLoanPage.getBarTooltip();
  expect(tooltip['Year']).toBe(year);

  const tooltipValue = EMICalculator.parseAmount(tooltip[series] ?? '');
  console.log(`[PERSONALLOAN.STEPS] Tooltip ${series}: ${tooltipValue} | chart data: ${chartValue}`);
  expect(tooltipValue).toBeGreaterThan(0);
  // The tooltip shows whole rupees
  expect(Math.abs(tooltipValue - chartValue)).toBeLessThan(1);
});

/**
 * Verify the calculated EMI is displayed
 */
Then(/^the EMI should be "([^"]*)"$/, async function (this: any, expectedEMI: string) {
  const personalLoanPage = new PersonalLoanPage(this.page);
  expect(await personalLoanPage.getDisplayedEMI()).toBe(EMICalculator.parseAmount(expectedEMI));
});
