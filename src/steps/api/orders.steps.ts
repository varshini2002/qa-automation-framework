import { When, Then, DataTable, Before } from '@cucumber/cucumber';
import { expect } from '@playwright/test';

interface CustomWorld {
  apiClient: any;
  response: any;
  statusCode: number;
  responseBody: any;
  products?: any[];
}

Before({ tags: '@api' }, async function (this: CustomWorld) {
  // Get products data for reference (API scenarios only; needs the mock API server)
  if (this.apiClient && !this.products) {
    const productsResponse = await this.apiClient.getProducts({ limit: 100 });
    const productsData = await productsResponse.json();
    this.products = productsData.data || [];
  }
});

When('I request all orders with default pagination', async function (this: CustomWorld) {
  this.response = await this.apiClient.getOrders();
  this.statusCode = this.response.status();
  this.responseBody = await this.response.json();
});

When('I request orders with page {int} and limit {int}',
  async function (this: CustomWorld, page: number, limit: number) {
    this.response = await this.apiClient.getOrders({ page, limit });
    this.statusCode = this.response.status();
    this.responseBody = await this.response.json();
  }
);

When('I request orders filtered by status {string}', async function (this: CustomWorld, status: string) {
  this.response = await this.apiClient.getOrders({ status });
  this.statusCode = this.response.status();
  this.responseBody = await this.response.json();
});

When('I request orders filtered by userId {int}', async function (this: CustomWorld, userId: number) {
  this.response = await this.apiClient.getOrders({ userId });
  this.statusCode = this.response.status();
  this.responseBody = await this.response.json();
});

When('I request orders filtered by userId {string}', async function (this: CustomWorld, userId: string) {
  const parsedUserId = Number(userId);
  this.response = await this.apiClient.getOrders({ userId: parsedUserId });
  this.statusCode = this.response.status();
  this.responseBody = await this.response.json();
});

When('I create an order with:', async function (this: CustomWorld, dataTable: DataTable) {
  const orderData: any = {};
  const rows = dataTable.rowsHash();

  Object.entries(rows).forEach(([key, value]) => {
    if (key === 'userId' || key === 'productId' || key === 'quantity') {
      const numVal = Number(value);
      orderData[key] = isNaN(numVal) ? value : numVal;
    } else {
      orderData[key] = value;
    }
  });

  console.log('[ORDERS.STEPS] Created orderData:', JSON.stringify(orderData));
  console.log('[ORDERS.STEPS] Calling createOrder with:', orderData);
  this.response = await this.apiClient.createOrder(orderData);
  console.log('[ORDERS.STEPS] Response status:', this.response.status());
  this.statusCode = this.response.status();
  this.responseBody = await this.response.json();
  console.log('[ORDERS.STEPS] Response body:', JSON.stringify(this.responseBody));
});

Then('the response should contain a list of orders', async function (this: CustomWorld) {
  expect(this.responseBody).toHaveProperty('success', true);
  expect(this.responseBody).toHaveProperty('data');
  expect(Array.isArray(this.responseBody.data)).toBe(true);
});

Then('each order should have id, userId, productId, quantity, totalPrice, status, and createdAt',
  async function (this: CustomWorld) {
    const orders = this.responseBody.data;
    expect(orders.length).toBeGreaterThan(0);
    orders.forEach((order: any) => {
      expect(order).toHaveProperty('id');
      expect(order).toHaveProperty('userId');
      expect(order).toHaveProperty('productId');
      expect(order).toHaveProperty('quantity');
      expect(order).toHaveProperty('totalPrice');
      expect(order).toHaveProperty('status');
      expect(order).toHaveProperty('createdAt');
    });
  }
);

Then('the response should contain at most {int} orders',
  async function (this: CustomWorld, maxOrders: number) {
    const orders = this.responseBody.data;
    expect(orders.length).toBeLessThanOrEqual(maxOrders);
  }
);

Then('all orders in response should have status {string}',
  async function (this: CustomWorld, expectedStatus: string) {
    const orders = this.responseBody.data;
    orders.forEach((order: any) => {
      expect(order.status.toLowerCase()).toBe(expectedStatus.toLowerCase());
    });
  }
);

Then('all orders in response should belong to userId {int}',
  async function (this: CustomWorld, expectedUserId: number) {
    const orders = this.responseBody.data;
    orders.forEach((order: any) => {
      expect(order.userId).toBe(expectedUserId);
    });
  }
);

Then('the response should contain the created order', async function (this: CustomWorld) {
  expect(this.responseBody).toHaveProperty('success', true);
  expect(this.responseBody).toHaveProperty('data');
  const order = this.responseBody.data;
  expect(order).toHaveProperty('id');
  expect(order).toHaveProperty('userId');
  expect(order).toHaveProperty('productId');
  expect(order).toHaveProperty('quantity');
  expect(order).toHaveProperty('totalPrice');
});

Then('the order status should be {string}', async function (this: CustomWorld, expectedStatus: string) {
  const order = this.responseBody.data;
  expect(order.status).toBe(expectedStatus.toLowerCase());
});

Then('the order totalPrice should be calculated correctly as product price times quantity',
  async function (this: CustomWorld) {
    const order = this.responseBody.data;
    if (!this.products) {
      this.products = [];
    }
    const product = this.products.find((p: any) => p.id === order.productId);
    if (product) {
      const expectedTotal = product.price * order.quantity;
      expect(order.totalPrice).toBe(expectedTotal);
    }
  }
);

Then('the order should have a createdAt timestamp', async function (this: CustomWorld) {
  const order = this.responseBody.data;
  expect(order.createdAt).toBeDefined();
  const timestamp = new Date(order.createdAt);
  expect(timestamp.getTime()).toBeGreaterThan(0);
});
