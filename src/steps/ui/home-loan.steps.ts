import { When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { HomeLoanPage } from '../../pages/HomeLoanPage';
import { EMICalculator } from '../../utils/calculator';

When('I select Home Loan', async function (this: any) {
  const homeLoanPage = new HomeLoanPage(this.page);
  await homeLoanPage.navigateToHomeLoan();
});

When('I enter loan amount as {string}', async function (this: any, amount: string) {
  const homeLoanPage = new HomeLoanPage(this.page);
  await homeLoanPage.enterLoanAmount(amount);
});

When('I enter interest rate as {string}', async function (this: any, interestRate: string) {
  const homeLoanPage = new HomeLoanPage(this.page);
  await homeLoanPage.enterInterestRate(interestRate);
});

When('I enter tenure as {string}', async function (this: any, tenure: string) {
  const homeLoanPage = new HomeLoanPage(this.page);
  await homeLoanPage.enterTenure(tenure);
});

When('I calculate EMI', async function (this: any) {
  const homeLoanPage = new HomeLoanPage(this.page);
  await homeLoanPage.calculateEMI();
});

Then('the EMI result should be displayed', async function (this: any) {
  const homeLoanPage = new HomeLoanPage(this.page);
  const displayedEMI = await homeLoanPage.getDisplayedEMI();

  expect(Number(displayedEMI.replace(/[₹,\s]/g, ''))).toBeGreaterThan(0);
});

Then('I independently calculate EMI in code', async function (this: any) {
  // Read back what the calculator form actually holds (#loanamount is shown as e.g. "25,00,000")
  const loanAmountText = await this.page.locator('#loanamount').inputValue();
  const interestRateText = await this.page.locator('#loaninterest').inputValue();
  const tenureText = await this.page.locator('#loanterm').inputValue();
  // #loanterm is in years or months depending on the Yr/Mo radio (name="loantenure")
  const tenureInMonths = await this.page.locator('#loanmonths').isChecked();

  const principal = EMICalculator.parseAmount(loanAmountText || '0');
  const annualRate = Number(interestRateText.replace('%', '')) || 0;
  const tenureValue = Number(tenureText.replace(/[^\d.]/g, '')) || 0;
  const tenureYears = tenureInMonths ? tenureValue / 12 : tenureValue;
  console.log('[HOMELOAN.STEPS] Form values read back - principal:', principal, 'rate:', annualRate, 'tenure (years):', tenureYears);

  this.expectedEMI = EMICalculator.calculateEMI(principal, annualRate, tenureYears);
  expect(this.expectedEMI).toBeGreaterThan(0);
});
