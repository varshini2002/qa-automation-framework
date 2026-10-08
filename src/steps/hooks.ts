import { Before, After, setDefaultTimeout } from '@cucumber/cucumber';
import { APIClient } from '../api/client';

// Increase timeout for async operations
setDefaultTimeout(30 * 1000);

interface CustomWorld {
  apiClient: APIClient;
  response: any;
  statusCode: number;
  responseBody: any;
  responseError: any;
}

Before(async function (this: any) {
  this.apiClient = new APIClient();
  this.response = null;
  this.statusCode = 0;
  this.responseBody = null;
  this.responseError = null;
});

After(async function (this: any) {
  if (this.apiClient) {
    await this.apiClient.dispose();
  }
});

// Export type for use in step definitions
export { CustomWorld };
