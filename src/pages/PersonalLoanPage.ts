import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { EMICalculator } from '../utils/calculator';

interface BarChartData {
  categories: string[];
  series: { name: string; index: number; type: string; points: { category: string; y: number }[] }[];
}

export class PersonalLoanPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  // Loan product tabs: <li id="personal-loan"><a href="#">…; the active product is mirrored in #loanproduct
  private personalLoanTab(): Locator {
    return this.page.locator('#personal-loan');
  }

  private personalLoanTabLink(): Locator {
    return this.page.locator('#personal-loan > a');
  }

  private loanProductInput(): Locator {
    return this.page.locator('#loanproduct');
  }

  private emiResultValue(): Locator {
    return this.page.locator('#emiamount span');
  }

  // Bootstrap Datepicker (month mode) attached to the schedule start-month input
  private startMonthInput(): Locator {
    return this.page.locator('#startmonthyear');
  }

  private datepickerMonthsView(): Locator {
    return this.page.locator('.datepicker-dropdown .datepicker-months');
  }

  // Yearly payment bar chart (Highcharts)
  private barChart(): Locator {
    return this.page.locator('#emibarchart');
  }

  private barChartTooltip(): Locator {
    return this.page.locator('#emibarchart g.highcharts-tooltip');
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

  async selectPersonalLoan(): Promise<void> {
    if ((await this.loanProductInput().inputValue()) === 'personal-loan') {
      console.log('[PERSONALLOAN.PAGE] Personal Loan calculator is already active');
      return;
    }

    // Switching product loads Personal Loan defaults and recalculates
    await this.waitForEmiRerender(() => this.personalLoanTabLink().click());

    await expect(this.loanProductInput()).toHaveValue('personal-loan');
    await expect(this.personalLoanTab()).toHaveClass(/\bactive\b/);
    console.log('[PERSONALLOAN.PAGE] ✓ Personal Loan calculator is active');
  }

  /**
   * Drag a jQuery UI slider handle to the value with the real mouse. The slider only
   * recalculates for user-originated changes (its change handler checks originalEvent),
   * so the value must not be set programmatically.
   */
  private async dragSlider(sliderId: string, target: number): Promise<void> {
    const slider = this.page.locator(`#${sliderId}`);
    const handle = this.page.locator(`#${sliderId} .ui-slider-handle`);

    // Read-only access to the slider's configuration and current value
    const readSlider = () =>
      slider.evaluate((el: any) => {
        const $slider = (globalThis as any).jQuery(el);
        return {
          min: $slider.slider('option', 'min') as number,
          max: $slider.slider('option', 'max') as number,
          step: $slider.slider('option', 'step') as number,
          value: $slider.slider('value') as number,
        };
      });

    const { min, max, step, value } = await readSlider();
    if (target < min || target > max) {
      throw new Error(`#${sliderId}: target ${target} is outside the slider range ${min}-${max}`);
    }
    if (value === target) {
      // No movement means no change event and nothing to recalculate
      return;
    }

    await slider.scrollIntoViewIfNeeded();
    const track = await slider.boundingBox();
    const handleBox = await handle.boundingBox();
    if (!track || !handleBox) {
      throw new Error(`#${sliderId}: slider track or handle is not rendered`);
    }

    const pixelsPerStep = track.width / ((max - min) / step);
    if (pixelsPerStep < 1) {
      throw new Error(`#${sliderId}: track is too narrow (${pixelsPerStep.toFixed(2)}px per step) to drag precisely`);
    }

    const targetX = track.x + (track.width * (target - min)) / (max - min);
    const targetY = track.y + track.height / 2;

    await this.waitForEmiRerender(async () => {
      await this.page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2);
      await this.page.mouse.down();
      await this.page.mouse.move(targetX, targetY, { steps: 10 });
      await this.page.mouse.up();
    });

    const actual = (await readSlider()).value;
    console.log(`[PERSONALLOAN.PAGE] #${sliderId} dragged: ${value} -> ${actual} (target ${target})`);
    if (actual !== target) {
      throw new Error(`#${sliderId}: expected slider value ${target} after drag, got ${actual}`);
    }
  }

  async setLoanAmountWithSlider(amount: number): Promise<void> {
    await this.dragSlider('loanamountslider', amount);
    // The slider writes its value into the paired input (formatted, e.g. "10,00,000")
    expect(EMICalculator.parseAmount(await this.page.locator('#loanamount').inputValue())).toBe(amount);
  }

  async setInterestRateWithSlider(rate: number): Promise<void> {
    await this.dragSlider('loaninterestslider', rate);
    expect(Number(await this.page.locator('#loaninterest').inputValue())).toBe(rate);
  }

  async setTenureYearsWithSlider(years: number): Promise<void> {
    // #loantermslider is in years while the Yr radio (name="loantenure") is selected
    await expect(this.page.locator('#loanyears')).toBeChecked();
    await this.dragSlider('loantermslider', years);
    expect(Number(await this.page.locator('#loanterm').inputValue())).toBe(years);
  }

  /**
   * Pick the month the payment schedule starts from via the calendar widget.
   * This does not change the tenure; it shifts the schedule (and the bar chart years).
   * @param month - Month label as shown in the picker, e.g. "Jan"
   */
  async selectScheduleStartMonth(month: string, year: number): Promise<void> {
    const expectedValue = `${month} ${year}`;
    if ((await this.startMonthInput().inputValue()) === expectedValue) {
      return;
    }

    await this.startMonthInput().click();
    const monthsView = this.datepickerMonthsView();
    await expect(monthsView).toBeVisible();

    // Navigate the month view's year header to the target year
    const yearSwitch = monthsView.locator('th.datepicker-switch');
    let shownYear = Number(await yearSwitch.textContent());
    while (shownYear !== year) {
      const direction = shownYear < year ? 'th.next' : 'th.prev';
      shownYear += shownYear < year ? 1 : -1;
      await monthsView.locator(direction).click();
      await expect(yearSwitch).toHaveText(String(shownYear));
    }

    // Month cells carry no attributes besides class="month", so match the exact label within the picker
    const monthCell = monthsView.locator('span.month', { hasText: new RegExp(`^${month}$`) });
    await this.waitForEmiRerender(() => monthCell.click());

    await expect(this.startMonthInput()).toHaveValue(expectedValue);
    await expect(monthsView).toBeHidden();
    console.log('[PERSONALLOAN.PAGE] ✓ Schedule start month selected:', expectedValue);
  }

  async getFormValues(): Promise<{ principal: number; annualRate: number; tenureYears: number }> {
    const tenureInMonths = await this.page.locator('#loanmonths').isChecked();
    const tenureValue = Number(await this.page.locator('#loanterm').inputValue());
    return {
      principal: EMICalculator.parseAmount(await this.page.locator('#loanamount').inputValue()),
      annualRate: Number(await this.page.locator('#loaninterest').inputValue()),
      tenureYears: tenureInMonths ? tenureValue / 12 : tenureValue,
    };
  }

  async getDisplayedEMI(): Promise<number> {
    // #emiamount renders as <h4>Loan EMI</h4><p>₹<span>22,244</span></p>
    const text = (await this.emiResultValue().textContent()) ?? '';
    console.log('[PERSONALLOAN.PAGE] Displayed EMI:', text);
    return EMICalculator.parseAmount(text);
  }

  async isBarChartVisible(): Promise<boolean> {
    return this.page.locator('#emibarchart .highcharts-root').isVisible();
  }

  /**
   * Categories and column/line series data of the Highcharts chart bound to #emibarchart
   * (via its data-highcharts-chart index; the chart is rebuilt on every recalculation).
   */
  private async getBarChartData(): Promise<BarChartData> {
    const data: BarChartData | null = await this.barChart().evaluate((el: any) => {
      const highcharts = (globalThis as any).Highcharts;
      const index = el.getAttribute('data-highcharts-chart');
      const chart = highcharts && index !== null ? highcharts.charts[Number(index)] : undefined;
      if (!chart) return null;
      return {
        categories: chart.xAxis[0].categories.map(String),
        series: chart.series.map((s: any) => ({
          name: s.name,
          index: s.index,
          type: s.type,
          points: s.points.map((p: any) => ({ category: String(p.category), y: p.y })),
        })),
      };
    });

    if (!data) throw new Error('Highcharts chart instance not found for #emibarchart');
    return data;
  }

  private async getColumnSeries(seriesName: string) {
    const series = (await this.getBarChartData()).series.find((s) => s.name === seriesName && s.type === 'column');
    if (!series) throw new Error(`Column series "${seriesName}" not found in #emibarchart`);
    return series;
  }

  async getBarChartYears(): Promise<string[]> {
    return (await this.getBarChartData()).categories;
  }

  /**
   * Count the rendered bars of one column series. The bare .highcharts-series class excludes the
   * legend item (which shares the highcharts-series-N/highcharts-column-series classes and has a
   * rect.highcharts-point swatch).
   */
  async countBars(seriesName: string): Promise<number> {
    const series = await this.getColumnSeries(seriesName);
    return this.page
      .locator(`#emibarchart g.highcharts-series.highcharts-series-${series.index}.highcharts-column-series rect.highcharts-point`)
      .count();
  }

  /**
   * Hover the bar of `seriesName` for `year` with the real mouse and wait for the Highcharts tooltip.
   * The bar is located through the chart's data (series name + year category), not DOM position.
   * @returns the chart's data value for that bar
   */
  async hoverBar(seriesName: string, year: string): Promise<number> {
    await this.barChart().scrollIntoViewIfNeeded();

    const target: { value: number; x: number; y: number; isTopmost: boolean } | null = await this.barChart().evaluate(
      (el: any, args: { seriesName: string; year: string }) => {
        const g = globalThis as any;
        const chart = g.Highcharts.charts[Number(el.getAttribute('data-highcharts-chart'))];
        const series = chart.series.find((s: any) => s.name === args.seriesName && s.type === 'column');
        const point = series && series.points.find((p: any) => String(p.category) === args.year);
        if (!point || !point.graphic) return null;
        const box = point.graphic.element.getBoundingClientRect();
        const x = box.x + box.width / 2;
        const y = box.y + box.height / 2;
        return { value: point.y, x, y, isTopmost: g.document.elementFromPoint(x, y) === point.graphic.element };
      },
      { seriesName, year }
    );

    if (!target) throw new Error(`No "${seriesName}" bar for year ${year} in #emibarchart`);
    if (!target.isTopmost) throw new Error(`"${seriesName}" bar for year ${year} is covered by another element`);

    await this.page.mouse.move(target.x, target.y);
    await expect(this.barChartTooltip()).toBeVisible();
    console.log(`[PERSONALLOAN.PAGE] ✓ Hovered "${seriesName}" bar for ${year} (chart value ${target.value})`);
    return target.value;
  }

  /**
   * Read the visible bar chart tooltip, e.g. "Year : 2027" / "Principal : ₹ 2,29,372",
   * as a map of label -> value.
   */
  async getBarTooltip(): Promise<Record<string, string>> {
    await expect(this.barChartTooltip()).toBeVisible();
    const lines = await this.page.locator('#emibarchart g.highcharts-tooltip text tspan').allTextContents();
    console.log('[PERSONALLOAN.PAGE] Tooltip lines:', JSON.stringify(lines));

    const entries: Record<string, string> = {};
    for (const line of lines) {
      const separator = line.indexOf(':');
      if (separator > 0) {
        entries[line.slice(0, separator).trim()] = line.slice(separator + 1).trim();
      }
    }
    return entries;
  }
}
