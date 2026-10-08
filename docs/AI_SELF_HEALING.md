# AI Self-Healing (Section B5): Brittle Locator Detection and Repair

## Overview

This section documents how AI assistance was used to detect brittle or broken locators in the
EMI Calculator UI automation and repair them against the live DOM of https://emicalculator.net/.

**Scope, stated plainly:** this is an *AI-assisted repair process*, not runtime self-healing.
The framework does not swap locators automatically while tests run. Broken locators were
identified from failures and code review, the live DOM was inspected, AI suggested and reasoned
about replacements, and the chosen repairs were applied to the page objects by hand and verified
by running the tests.

The intentionally brittle examples and their repairs live in
[src/pages/BrokenLocators.ts](../src/pages/BrokenLocators.ts). That file is **not** a page object
and is not imported by any test; the production page objects
([HomeLoanPage.ts](../src/pages/HomeLoanPage.ts), [PersonalLoanPage.ts](../src/pages/PersonalLoanPage.ts))
use only the repaired strategies.

---

## Broken Locators and Repairs

All five examples were real issues in this project.

| # | Element | Broken locator | Why it is brittle | Repair | Used in |
|---|---------|----------------|-------------------|--------|---------|
| 1 | Calculate button | `button:has-text("Calculate")` | Assumes a control that does not exist; the site recalculates from each field's change handler. Caused the original `"Calculate button not found"` failure. | No click: commit each field (fill + blur) and wait for the `#emiamount` re-render; read `#emiamount span` | `HomeLoanPage.fillAndCommit()`, `waitForEmiRerender()`, `calculateEMI()` |
| 2 | Interest rate input | `input[aria-label*="interest" i], input[placeholder*="interest" i], input[name*="rate" i]` | Guessed attributes; the field is `id/name="loaninterest"` with no aria-label or placeholder | `#loaninterest` | `HomeLoanPage.interestRateInput()`, `home-loan.steps.ts` |
| 3 | Tenure input | `input[type="text"] >> nth=2` | Positional ("third text input on the page") | `#loanterm` (`name="loantenure"` is the Yr/Mo radio group) | `HomeLoanPage.tenureInput()`, `home-loan.steps.ts` |
| 4 | Pie chart values | `[data-testid="chart-value"], .chart-value, .pie-value, .chart-label` | Guessed names; the Highcharts pie has SVG slices and percentage labels only | `#emipiechart g.highcharts-series.highcharts-pie-series path.highcharts-point` + values from the Highcharts chart, cross-checked against the % labels | `HomeLoanPage.getPieChartValues()` |
| 5 | Bar chart bars | `#emibarchart g.highcharts-series-1.highcharts-column-series rect.highcharts-point` | Also matches the legend swatch (observed 4 matches for 3 bars) | Add the bare `highcharts-series` class: `#emibarchart g.highcharts-series.highcharts-series-1.highcharts-column-series rect.highcharts-point` | `PersonalLoanPage.countBars()` |

`BrokenLocators.ts` also exports `compareLocators(page)`, which reports how many elements each
broken and repaired locator matches on the current page. It only counts matches; it does not
repair or retry anything, and it is not part of the test suite.

---

## Repair Workflow

1. **Detect** – a step fails (e.g. `Calculate button not found`, `Received: 0`), or review finds a
   positional/guessed selector.
2. **Inspect the live DOM** – list the real ids, names, classes and event handlers of the target
   element (for example, the calculator inputs are `#loanamount`, `#loaninterest`, `#loanterm`;
   the charts are Highcharts SVGs in `#emipiechart` and `#emibarchart`).
3. **Ask AI for alternatives** – using the prompt template below, with the failing locator and the
   real DOM context.
4. **Choose the most stable option** – using the ranking below, and reject suggestions that rely on
   guessed attributes, position, broad text matching, `force`, or fixed waits.
5. **Apply and verify** – update the page object, then run the affected Cucumber feature against
   the live site.

### Prompt Template

```
The following Playwright locator failed or is brittle:
Locator: {locator}
Element: {element_description}
Page URL: {url}
Error / symptom: {error_message}

Relevant live DOM (copied from the page):
{dom_snippet}

Requirements:
- Prefer stable ids or attributes that exist in the DOM above
- No positional selectors, no broad text selectors, no force, no fixed waits
- Explain why each suggestion is more stable

Suggest up to 3 alternatives, most robust first.
```

### Locator Preference (most to least stable)

1. Unique ids / stable attributes present in the live DOM (`#loanterm`, `#home-loan > a`)
2. Accessible role / label locators, when the page provides real labels
3. Library-generated structure that is part of the component's contract (Highcharts
   `highcharts-series`, `highcharts-point`), scoped to a container id
4. Exact text scoped to a small container, only when nothing else identifies the element
   (e.g. month cells in the datepicker)
5. Positional selectors – avoid

---

## How AI Was Used as a Pair Programmer

- **DOM inspection:** AI wrote and ran small Playwright probes against the live site to list
  inputs, event handlers, slider options and the Highcharts structure. Repairs were based on that
  output, not on guesses.
- **Diagnosis:** e.g. it established that the calculator has no Calculate button and recalculates
  asynchronously after each field's change event, which is why the repaired flow waits for the
  `#emiamount` re-render instead of clicking.
- **Review:** suggested locators were checked against the rules above before being adopted.
- **Verification:** each repair was confirmed by running the affected Cucumber feature.

## Limitations

- No runtime self-healing: a locator that breaks in future still fails the test and needs the
  workflow above.
- The repaired locators depend on emicalculator.net's current ids and Highcharts markup; a site
  redesign may require repeating the workflow.
