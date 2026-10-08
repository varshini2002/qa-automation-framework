import { APIRequestContext, APIResponse, request } from '@playwright/test';
import { config } from '../utils/config';

export class APIClient {
  private apiContext: APIRequestContext | null = null;
  private baseURL: string;

  constructor(baseURL: string = config.apiBaseURL) {
    this.baseURL = baseURL;
  }

  async initialize(): Promise<void> {
    if (!this.apiContext) {
      this.apiContext = await request.newContext({
        baseURL: this.baseURL,
      });
    }
  }

  async get(endpoint: string, options?: any): Promise<APIResponse> {
    await this.initialize();
    return this.apiContext!.get(endpoint, options);
  }

  async post(endpoint: string, data?: any, options?: any): Promise<APIResponse> {
    await this.initialize();
    console.log('[API.CLIENT.POST] endpoint:', endpoint);
    console.log('[API.CLIENT.POST] data:', JSON.stringify(data));
    console.log('[API.CLIENT.POST] typeof data:', typeof data);

    const requestConfig = {
      ...options,
      data,
      headers: {
        ...(options?.headers || {}),
        'Content-Type': 'application/json',
      },
    };
    console.log('[API.CLIENT.POST] Full request config:', JSON.stringify(requestConfig, null, 2));

    return this.apiContext!.post(endpoint, requestConfig);
  }

  async put(endpoint: string, data?: any, options?: any): Promise<APIResponse> {
    await this.initialize();
    return this.apiContext!.put(endpoint, {
      ...options,
      data,
    });
  }

  async delete(endpoint: string, options?: any): Promise<APIResponse> {
    await this.initialize();
    return this.apiContext!.delete(endpoint, options);
  }

  // Product-specific methods
  async getProducts(params?: {
    page?: number;
    limit?: number;
    category?: string;
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    sort?: string;
  }): Promise<APIResponse> {
    const queryParams = new URLSearchParams();
    if (params?.page !== undefined) queryParams.append('page', String(params.page));
    if (params?.limit !== undefined) queryParams.append('limit', String(params.limit));
    if (params?.category) queryParams.append('category', params.category);
    if (params?.search) queryParams.append('search', params.search);
    if (params?.minPrice !== undefined) queryParams.append('minPrice', String(params.minPrice));
    if (params?.maxPrice !== undefined) queryParams.append('maxPrice', String(params.maxPrice));
    if (params?.sort) queryParams.append('sort', params.sort);

    const query = queryParams.toString();
    return this.get(`/api/products${query ? '?' + query : ''}`);
  }

  // Order-specific methods
  async getOrders(params?: {
    page?: number;
    limit?: number;
    status?: string;
    userId?: number;
  }): Promise<APIResponse> {
    const queryParams = new URLSearchParams();
    if (params?.page !== undefined) queryParams.append('page', String(params.page));
    if (params?.limit !== undefined) queryParams.append('limit', String(params.limit));
    if (params?.status) queryParams.append('status', params.status);
    if (params?.userId !== undefined) queryParams.append('userId', String(params.userId));

    const query = queryParams.toString();
    return this.get(`/api/orders${query ? '?' + query : ''}`);
  }

  async createOrder(orderData: {
    userId: number;
    productId: number;
    quantity: number;
  }): Promise<APIResponse> {
    console.log('[API.CLIENT.CREATEORDER] Received orderData:', JSON.stringify(orderData));
    const response = await this.post('/api/orders', orderData);
    console.log('[API.CLIENT.CREATEORDER] Response from post():', response.status());
    return response;
  }

  async dispose(): Promise<void> {
    if (this.apiContext) {
      await this.apiContext.dispose();
    }
  }
}
