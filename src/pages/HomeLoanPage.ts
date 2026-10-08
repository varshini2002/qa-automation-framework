import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { EMICalculator } from '../utils/calculator';

export class HomeLoanPage extends BasePage {
  readonly baseURL = 'https://emicalculator.net/';

  constructor(page: Page) {
    super(page);
  }

  // Loan product tabs: <ul class="loanproduct-nav"><li id="home-loan" class="active"><a href="#">…
  // The active product is also mirrored in the hidden input #loanproduct ("home-loan", "car-loan", …)
  private homeLoanTab(): Locator {
    return this.page.locator('#home-loan');
  }

  private homeLoanTabLink(): Locator {
    return this.page.locator('#home-loan > a');
  }

  private loanProductInput(): Locator {
    return this.page.locator('#loanproduct');
  }

  async navigateToHomeLoan(): Promise<void> {
    console.log('[HOMELOAN.PAGE] navigateToHomeLoan - Starting');

    // The page title mentions Home Loan for every product, so check the active product instead
    const activeProduct = await this.loanProductInput().inputValue();
    if (activeProduct === 'home-loan') {
      console.log('[HOMELOAN.PAGE] ✓ Home Loan calculator is already active (#loanproduct = home-loan)');
      return;
    }

    // Switching product reloads that product's defaults and recalculates asynchronously,
    // so wait for that re-render before any field is edited
    console.log('[HOMELOAN.PAGE] Active product is', activeProduct, '- switching to Home Loan');
    await this.waitForEmiRerender(() => this.homeLoanTabLink().click());

    await expect(this.loanProductInput()).toHaveValue('home-loan');
    await expect(this.homeLoanTab()).toHaveClass(/\bactive\b/);
    console.log('[HOMELOAN.PAGE] ✓ Home Loan calculator is active');
  }

  // Calculator form fields and result, by their IDs on emicalculator.net
  private loanAmountInput(): Locator {
    return this.page.locator('#loanamount');
  }

  private interestRateInput(): Locator {
    return this.page.locator('#loaninterest');
  }

  private tenureInput(): Locator {
    return this.page.locator('#loanterm');
  }

  private emiResultValue(): Locator {
    return this.page.locator('#emiamount span');
  }

  /**
   * The site recalculates asynchronously (no Calculate button): each triggering action
   * schedules one recalculation that re-renders #emiamount. Run the action and wait for
   * that re-render so the result reflects it before the next action.
   */
  private async waitForEmiRerender(action: () => Promise<void>): Promise<void> {
    await this.page.evaluate(() => {
      const g = globalThis as any;
      g.__emiRendered = false;
      const observer = new g.MutationObserver(() => {
        g.__emiRendered = true;
        observer.disconnect();
      });
      observer.observe(g.document.querySelector('#emiamount'), { childList: true, subtree: true, characterData: true });
    });

    await action();
    await this.page.waitForFunction(() => (globalThis as any).__emiRendered === true);
  }

  /**
   * Fill a calculator field and commit it the way a user does: leaving the field fires its
   * native change event, which the site handles by recalculating.
   */
  private async fillAndCommit(input: Locator, value: string): Promise<void> {
    if ((await input.inputValue()) === value) {
      // Unchanged value: no change event fires and nothing needs recalculating
      return;
    }

    await this.waitForEmiRerender(async () => {
      await input.fill(value);
      await input.blur();
    });
  }

  async enterLoanAmount(amount: string): Promise<void> {
    // The input expects plain rupees; shorthand like "25L" would be read as ₹25
    const amountValue = String(EMICalculator.parseAmount(amount));
    console.log('[HOMELOAN.PAGE] enterLoanAmount - input:', amount, '-> typing:', amountValue);

    await this.fillAndCommit(this.loanAmountInput(), amountValue);
    console.log('[HOMELOAN.PAGE] ✓ Loan amount committed, field shows:', await this.loanAmountInput().inputValue());
  }

  async enterInterestRate(interest: string): Promise<void> {
    const rateValue = interest.replace('%', '').trim();
    console.log('[HOMELOAN.PAGE] enterInterestRate - input:', interest, '-> typing:', rateValue);

    await this.fillAndCommit(this.interestRateInput(), rateValue);
    console.log('[HOMELOAN.PAGE] ✓ Interest rate committed, field shows:', await this.interestRateInput().inputValue());
  }

  async enterTenure(tenure: string): Promise<void> {
    // Extract numeric value from tenure string like "10 years" -> "10"
    const tenureValue = tenure.replace(/[^\d.]/g, '').trim();
    console.log('[HOMELOAN.PAGE] enterTenure - input:', tenure, '-> typing:', tenureValue);

    if (!tenureValue) {
      throw new Error(`Invalid tenure value: "${tenure}" - could not extract number`);
    }

    await this.fillAndCommit(this.tenureInput(), tenureValue);
    console.log('[HOMELOAN.PAGE] ✓ Tenure committed, field shows:', await this.tenureInput().inputValue());
  }

  async calculateEMI(): Promise<void> {
    // emicalculator.net has no Calculate button: #emicalculatorform has no submit control or
    // submit handler, and the site recalculates from each field's change handler. Each
    // enter*() call has already committed its field and waited for that recalculation, so
    // this step confirms the result is populated with a non-zero EMI.
    console.log('[HOMELOAN.PAGE] calculateEMI - verifying the calculated EMI result');

    const emiValue = this.emiResultValue();
    await expect(emiValue).toHaveText(/^[1-9][\d,]*$/);
    console.log('[HOMELOAN.PAGE] ✓ EMI result populated:', await emiValue.textContent());
  }

  async getDisplayedEMI(): Promise<string> {
    // #emiamount renders as <h4>Loan EMI</h4><p>₹<span>33,038</span></p>
    const text = (await this.emiResultValue().textContent()) ?? '';
    const numericValue = text.replace(/[^\d]/g, '');
    console.log('[HOMELOAN.PAGE] getDisplayedEMI -', JSON.stringify(text), '->', numericValue);

    if (!numericValue) {
      throw new Error(`EMI result #emiamount has no numeric value: "${text}"`);
    }
    return numericValue;
  }

  // The break-up pie is a Highcharts chart rendered into #emipiechart
  private pieSeries(): Locator {
    return this.page.locator('#emipiechart g.highcharts-series.highcharts-pie-series');
  }

  private pieDataLabels(): Locator {
    return this.page.locator('#emipiechart g.highcharts-data-labels.highcharts-pie-series .highcharts-data-label');
  }

  async isPieChartVisible(): Promise<boolean> {
    try {
      await this.pieSeries().waitFor({ timeout: 2000, state: 'visible' });
      return true;
    } catch {
      return false;
    }
  }

  async getPieChartValues(): Promise<{ principal: number; interest: number }> {
    if (!(await this.isPieChartVisible())) {
      throw new Error('Pie chart (#emipiechart) is not visible');
    }

    const sliceCount = await this.pieSeries().locator('path.highcharts-point').count();
    if (sliceCount !== 2) {
      throw new Error(`Expected 2 pie chart slices, found ${sliceCount}`);
    }

    // Slices are SVG paths and their labels only show percentages, so the amounts are read
    // from the Highcharts instance bound to #emipiechart (via its data-highcharts-chart index)
    const points: { name: string; y: number }[] | null = await this.page
      .locator('#emipiechart')
      .evaluate((el: any) => {
        const highcharts = (globalThis as any).Highcharts;
        const index = el.getAttribute('data-highcharts-chart');
        const chart = highcharts && index !== null ? highcharts.charts[Number(index)] : undefined;
        if (!chart || !chart.series[0]) return null;
        return chart.series[0].points.map((p: any) => ({ name: p.name, y: p.y }));
      });

    if (!points) throw new Error('Highcharts pie chart instance not found for #emipiechart');
    console.log('[HOMELOAN.PAGE] Pie chart points:', JSON.stringify(points));

    const principal = points.find((p) => p.name === 'Principal Loan Amount')?.y;
    const interest = points.find((p) => p.name === 'Total Interest')?.y;
    if (principal === undefined || interest === undefined) {
      throw new Error(`Pie chart points missing principal/interest: ${JSON.stringify(points)}`);
    }

    // Cross-check the instance data against the rendered percentage labels
    const labels = await this.pieDataLabels().allTextContents();
    console.log('[HOMELOAN.PAGE] Pie chart rendered labels:', JSON.stringify(labels));
    const renderedPercents = labels.map((text) => parseFloat(text.replace('%', '')));
    const total = principal + interest;
    const expectedPercents = [(principal / total) * 100, (interest / total) * 100];
    const labelsMatch =
      renderedPercents.length === 2 &&
      renderedPercents.every((pct, i) => Math.abs(pct - expectedPercents[i]) < 0.1);
    if (!labelsMatch) {
      throw new Error(
        `Rendered pie labels ${JSON.stringify(labels)} do not match chart data ` +
        `(principal=${principal}, interest=${interest})`
      );
    }

    return { principal, interest };
  }

  async visitHomeLoanCalculator(): Promise<void> {
    await this.goto(this.baseURL);
    await this.page.waitForLoadState('networkidle');
    await this.navigateToHomeLoan();
  }
}
