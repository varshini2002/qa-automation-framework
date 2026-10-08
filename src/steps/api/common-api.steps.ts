import { Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';

interface CustomWorld {
  response: any;
  statusCode: number;
  responseBody: any;
}

Then('the response status code should be {int}', async function (this: CustomWorld, expectedStatus: number) {
  expect(this.statusCode).toBe(expectedStatus);
});

Then('the response should have pagination information', async function (this: CustomWorld) {
  expect(this.responseBody).toHaveProperty('pagination');
  const { pagination } = this.responseBody;
  expect(pagination).toHaveProperty('page');
  expect(pagination).toHaveProperty('limit');
  expect(pagination).toHaveProperty('total');
  expect(pagination).toHaveProperty('pages');
});

Then('the pagination should show page {int} with limit {int}', async function (this: CustomWorld, expectedPage: number, expectedLimit: number) {
  const { pagination } = this.responseBody;
  expect(pagination.page).toBe(expectedPage);
  expect(pagination.limit).toBe(expectedLimit);
});

Then('the response should contain error message {string}', async function (this: CustomWorld, expectedErrorMsg: string) {
  expect(this.responseBody).toHaveProperty('error');
  expect(this.responseBody.error).toContain(expectedErrorMsg);
});
