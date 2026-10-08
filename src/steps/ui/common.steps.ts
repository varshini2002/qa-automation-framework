import { Given, When, Then, Before, After } from '@cucumber/cucumber';
import { Page, Browser, chromium, expect } from '@playwright/test';
import { config } from '../../utils/config';
import { HomeLoanPage } from '../../pages/HomeLoanPage';
import { EMICalculator } from '../../utils/calculator';

// Global variables for browser and page
let browser: Browser;
let page: Page;

// Attach to the world context so steps can access it
interface UIWorld {
  page?: Page;
}

Before(async function (this: any) {
  // Initialize browser and page before each scenario
  browser = await chromium.launch({
    headless: true,
  });

  const context = await browser.newContext();
  page = await context.newPage();

  // Attach page to the world/this context so all steps can access it
  this.page = page;
});

After(async function (this: any) {
  // Clean up after each scenario
  if (page) {
    await page.close();
  }
  if (browser) {
    await browser.close();
  }
});

Given('I navigate to the EMI Calculator application', async function (this: any) {
  const baseURL = config.baseURL || 'https://emicalculator.net/';
  await page.goto(baseURL);
  this.page = page;
});

Then('the calculated EMI should match the displayed EMI', async function (this: any) {
  const homeLoanPage = new HomeLoanPage(this.page);
  const displayedEMI = await homeLoanPage.getDisplayedEMI();
  const displayedNumber = Number(displayedEMI.replace(/[₹,\s]/g, ''));

  expect(Number.isFinite(displayedNumber)).toBe(true);
  expect(displayedNumber).toBeGreaterThan(0);
  expect(displayedNumber).toBeCloseTo(this.expectedEMI, 0);
});

Then('the pie chart should be visible', async function (this: any) {
  const homeLoanPage = new HomeLoanPage(this.page);
  const isVisible = await homeLoanPage.isPieChartVisible();

  expect(isVisible).toBe(true);
});

Then('the pie chart should contain numerical values', async function (this: any) {
  const homeLoanPage = new HomeLoanPage(this.page);
  const pieChartValues = await homeLoanPage.getPieChartValues();
  const values = [pieChartValues.principal, pieChartValues.interest];

  expect(values.length).toBe(2);
  expect(values.every((value) => Number.isFinite(value))).toBe(true);
  expect(values.every((value) => value > 0)).toBe(true);
});

Then('both pie chart values should be greater than zero', async function (this: any) {
  const homeLoanPage = new HomeLoanPage(this.page);
  const pieChartValues = await homeLoanPage.getPieChartValues();

  expect(pieChartValues.principal).toBeGreaterThan(0);
  expect(pieChartValues.interest).toBeGreaterThan(0);
});
