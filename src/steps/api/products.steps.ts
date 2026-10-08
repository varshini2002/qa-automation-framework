import { When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';

interface CustomWorld {
  apiClient: any;
  response: any;
  statusCode: number;
  responseBody: any;
}

When('I request all products with default pagination', async function (this: CustomWorld) {
  this.response = await this.apiClient.getProducts();
  this.statusCode = this.response.status();
  this.responseBody = await this.response.json();
});

When('I request products filtered by category {string}', async function (this: CustomWorld, category: string) {
  this.response = await this.apiClient.getProducts({ category });
  this.statusCode = this.response.status();
  this.responseBody = await this.response.json();
});

When('I request products with search term {string}', async function (this: CustomWorld, searchTerm: string) {
  this.response = await this.apiClient.getProducts({ search: searchTerm });
  this.statusCode = this.response.status();
  this.responseBody = await this.response.json();
});

When('I request products with minPrice {int} and maxPrice {int}',
  async function (this: CustomWorld, minPrice: number, maxPrice: number) {
    this.response = await this.apiClient.getProducts({ minPrice, maxPrice });
    this.statusCode = this.response.status();
    this.responseBody = await this.response.json();
  }
);

When('I request products sorted by {string}', async function (this: CustomWorld, sortField: string) {
  this.response = await this.apiClient.getProducts({ sort: sortField });
  this.statusCode = this.response.status();
  this.responseBody = await this.response.json();
});

When('I request products with page {int} and limit {int}',
  async function (this: CustomWorld, page: number, limit: number) {
    this.response = await this.apiClient.getProducts({ page, limit });
    this.statusCode = this.response.status();
    this.responseBody = await this.response.json();
  }
);

When('I request products with minPrice {string}', async function (this: CustomWorld, minPrice: string) {
  const parsedMinPrice = isNaN(Number(minPrice)) ? minPrice : Number(minPrice);
  this.response = await this.apiClient.getProducts({ minPrice: parsedMinPrice });
  this.statusCode = this.response.status();
  this.responseBody = await this.response.json();
});

When('I request products with page {int}', async function (this: CustomWorld, page: number) {
  this.response = await this.apiClient.getProducts({ page });
  this.statusCode = this.response.status();
  this.responseBody = await this.response.json();
});

When('I request products with limit {int}', async function (this: CustomWorld, limit: number) {
  this.response = await this.apiClient.getProducts({ limit });
  this.statusCode = this.response.status();
  this.responseBody = await this.response.json();
});

Then('the response should contain a list of products', async function (this: CustomWorld) {
  expect(this.responseBody).toHaveProperty('success', true);
  expect(this.responseBody).toHaveProperty('data');
  expect(Array.isArray(this.responseBody.data)).toBe(true);
});

Then('each product should have id, name, category, price, and stock', async function (this: CustomWorld) {
  const products = this.responseBody.data;
  expect(products.length).toBeGreaterThan(0);
  products.forEach((product: any) => {
    expect(product).toHaveProperty('id');
    expect(product).toHaveProperty('name');
    expect(product).toHaveProperty('category');
    expect(product).toHaveProperty('price');
    expect(product).toHaveProperty('stock');
  });
});

Then('all products in response should have category {string}',
  async function (this: CustomWorld, expectedCategory: string) {
    const products = this.responseBody.data;
    products.forEach((product: any) => {
      expect(product.category.toLowerCase()).toBe(expectedCategory.toLowerCase());
    });
  }
);

Then('all products in response should have {string} in name or category',
  async function (this: CustomWorld, searchTerm: string) {
    const products = this.responseBody.data;
    const lowerSearch = searchTerm.toLowerCase();
    products.forEach((product: any) => {
      const hasMatch =
        product.name.toLowerCase().includes(lowerSearch) ||
        product.category.toLowerCase().includes(lowerSearch);
      expect(hasMatch).toBe(true);
    });
  }
);

Then('all products should have price between {int} and {int}',
  async function (this: CustomWorld, minPrice: number, maxPrice: number) {
    const products = this.responseBody.data;
    products.forEach((product: any) => {
      expect(product.price).toBeGreaterThanOrEqual(minPrice);
      expect(product.price).toBeLessThanOrEqual(maxPrice);
    });
  }
);

Then('the products should be sorted by price in ascending order', async function (this: CustomWorld) {
  const products = this.responseBody.data;
  for (let i = 1; i < products.length; i++) {
    expect(products[i].price).toBeGreaterThanOrEqual(products[i - 1].price);
  }
});

Then('the products should be sorted by name in ascending order', async function (this: CustomWorld) {
  const products = this.responseBody.data;
  for (let i = 1; i < products.length; i++) {
    expect(products[i].name.localeCompare(products[i - 1].name)).toBeGreaterThanOrEqual(0);
  }
});
