import { API_URL_MISSING_MESSAGE, resolveApiUrl } from './apiConfig';
import { hasAdminRoleUpdateEndpoint } from './adminRoleErrors';

export const API_URL = resolveApiUrl((import.meta as any).env?.VITE_API_URL);
export const API_REQUEST_TIMEOUT_MS = 20 * 1000;

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

export class ApiTimeoutError extends Error {
  constructor(public endpoint: string, public timeoutMs: number) {
    super(`Request timed out after ${timeoutMs}ms`);
    this.name = 'ApiTimeoutError';
  }
}

export function isAuthExpiredError(error: unknown) {
  return error instanceof ApiError && (error.status === 401 || error.status === 403);
}

function isAbortError(error: unknown) {
  return (
    error instanceof Error &&
    (error.name === 'AbortError' || error.name === 'TimeoutError')
  );
}

export function isTransientApiError(error: unknown) {
  return error instanceof ApiTimeoutError || error instanceof TypeError || isAbortError(error);
}

function createTimeoutSignal(externalSignal?: AbortSignal | null) {
  const controller = new AbortController();
  let timedOut = false;
  let removeExternalAbort: (() => void) | null = null;

  const timeoutId = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, API_REQUEST_TIMEOUT_MS);

  if (externalSignal) {
    const handleAbort = () => controller.abort();

    if (externalSignal.aborted) {
      controller.abort();
    } else {
      externalSignal.addEventListener('abort', handleAbort, { once: true });
      removeExternalAbort = () => externalSignal.removeEventListener('abort', handleAbort);
    }
  }

  return {
    signal: controller.signal,
    didTimeout: () => timedOut,
    cleanup: () => {
      clearTimeout(timeoutId);
      removeExternalAbort?.();
    },
  };
}

function formatValidationLocation(loc: unknown) {
  if (!Array.isArray(loc)) return '';

  return loc
    .filter((part) => part !== 'body' && part !== 'query' && part !== 'path')
    .map(String)
    .join('.');
}

function formatApiErrorDetail(detail: unknown): string | null {
  if (!detail) return null;

  if (typeof detail === 'string') return detail;

  if (Array.isArray(detail)) {
    const messages = detail
      .map((item) => {
        if (typeof item === 'string') return item;
        if (!item || typeof item !== 'object') return null;

        const record = item as Record<string, unknown>;
        const message =
          typeof record.msg === 'string'
            ? record.msg
            : typeof record.message === 'string'
              ? record.message
              : null;

        if (!message) return null;

        const location = formatValidationLocation(record.loc);
        return location ? `${location}: ${message}` : message;
      })
      .filter((message): message is string => Boolean(message));

    return messages.length > 0 ? messages.join('; ') : null;
  }

  if (typeof detail === 'object') {
    const record = detail as Record<string, unknown>;
    if (typeof record.msg === 'string') return record.msg;
    if (typeof record.message === 'string') return record.message;
  }

  return null;
}

export function formatApiErrorMessage(errorData: unknown, fallback = 'API Error') {
  if (!errorData) return fallback;

  if (typeof errorData === 'string') return errorData;

  if (typeof errorData !== 'object') return String(errorData);

  const record = errorData as Record<string, unknown>;
  return (
    formatApiErrorDetail(record.detail) ||
    formatApiErrorDetail(record.errors) ||
    (typeof record.message === 'string' ? record.message : null) ||
    fallback
  );
}

async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  if (!API_URL) {
    throw new Error(API_URL_MISSING_MESSAGE);
  }

  const token = localStorage.getItem('access_token');
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const { signal: externalSignal, ...fetchOptions } = options;
  const timeoutSignal = createTimeoutSignal(externalSignal);

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...fetchOptions,
      headers,
      signal: timeoutSignal.signal,
    });

    if (!response.ok) {
      let errorMessage = 'API Error';
      try {
        const errorData = await response.json();
        errorMessage = formatApiErrorMessage(errorData, response.statusText || errorMessage);
      } catch (e) {
        errorMessage = response.statusText;
      }
      throw new ApiError(response.status, errorMessage);
    }

    // Handle empty responses (e.g., 204 No Content)
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  } catch (error) {
    if (timeoutSignal.didTimeout()) {
      throw new ApiTimeoutError(endpoint, API_REQUEST_TIMEOUT_MS);
    }

    // If it's already an ApiError, rethrow it so the caller can handle it
    if (error instanceof ApiError) {
      throw error;
    }
    // Otherwise, it's a network error (e.g., CORS, backend down)
    console.error(`[API Error] Network error or API unavailable for ${endpoint}:`, error);
    throw error;
  } finally {
    timeoutSignal.cleanup();
  }
}

// --- Auth & Users ---
export const authApi = {
  telegramLogin: (initData: string) => 
    fetchApi<{ access_token: string; refresh_token: string; token_type: string }>('/auth/telegram-login', {
      method: 'POST',
      body: JSON.stringify({ initData }),
    }),
  getMe: () => fetchApi<any>('/users/me'),
};

// --- Dictionaries ---
export const dictsApi = {
  getRegions: () => fetchApi<any[]>('/dicts/regions'),
  getServiceCategories: () => fetchApi<any[]>('/dicts/services/categories'),
  getServices: (categoryId?: string) => 
    fetchApi<any[]>(`/dicts/services${categoryId ? `?category_id=${categoryId}` : ''}`),
  getCarBrands: () => fetchApi<any[]>('/dicts/cars/brands'),
  getCarModels: (brandId?: string) => 
    fetchApi<any[]>(`/dicts/cars/models${brandId ? `?brand_id=${brandId}` : ''}`),
};

// --- Media ---
export const mediaApi = {
  getPresignedUrl: (fileName: string, contentType: string) =>
    fetchApi<{ upload_url: string; file_key: string }>('/media/presigned-url', {
      method: 'POST',
      body: JSON.stringify({ file_name: fileName, content_type: contentType }),
    }),
  uploadToS3: async (uploadUrl: string, file: File) => {
    const response = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type,
      },
      body: file,
    });
    if (!response.ok) throw new Error('Failed to upload file to S3');
  },
};

// --- Customer ---
export const customerApi = {
  createProfile: (data: { name: string; phone: string }) =>
    fetchApi<any>('/customer/profile', { method: 'POST', body: JSON.stringify(data) }),
  getOrders: () => fetchApi<any[]>('/customer/orders'),
  createOrder: (data: any) => fetchApi<any>('/customer/orders', { method: 'POST', body: JSON.stringify(data) }),
  getOrderResponses: (orderId: string) => fetchApi<any[]>(`/customer/orders/${orderId}/responses`),
  acceptResponse: (orderId: string, responseId: string) =>
    fetchApi<any>(`/customer/orders/${orderId}/responses/${responseId}/accept`, { method: 'POST' }),
  rejectResponse: (orderId: string, responseId: string) =>
    fetchApi<any>(`/customer/orders/${orderId}/responses/${responseId}/reject`, { method: 'POST' }),
  cancelOrder: (orderId: string) => fetchApi<any>(`/customer/orders/${orderId}/cancel`, { method: 'POST' }),
  getExecutors: () => fetchApi<any[]>('/customer/executors'),
  submitReview: (orderId: string, data: { rating: number, criteria: string[], text: string }) => 
    fetchApi<any>(`/customer/orders/${orderId}/review`, { method: 'POST', body: JSON.stringify(data) }),
};

// --- Executor ---
export const executorApi = {
  createProfile: (data: any) => fetchApi<any>('/executor/profile', { method: 'POST', body: JSON.stringify(data) }),
  getProfile: () => fetchApi<any>('/executor/profile'),
  updateProfile: (data: any) => fetchApi<any>('/executor/profile', { method: 'PUT', body: JSON.stringify(data) }),
  getFeed: () => fetchApi<any[]>('/executor/feed'),
  getActiveOrders: () => fetchApi<any[]>('/executor/orders/active'),
  respondToOrder: (orderId: string, data: { price?: number; comment?: string; estimated_duration?: string }) =>
    fetchApi<any>(`/executor/orders/${orderId}/respond`, { method: 'POST', body: JSON.stringify(data) }),
  rejectOrder: (orderId: string) => fetchApi<any>(`/executor/orders/${orderId}/reject`, { method: 'POST' }),
  completeOrder: (orderId: string) => fetchApi<any>(`/executor/orders/${orderId}/complete`, { method: 'POST' }),
};

// --- Admin ---
export const adminApi = {
  getDashboard: () => fetchApi<any>('/admin/dashboard'),
  getUsers: () => fetchApi<any[]>('/admin/users'),
  getExecutors: () => fetchApi<any[]>('/admin/executors'),
  getOrders: () => fetchApi<any[]>('/admin/orders'),
  getPayments: () => fetchApi<any[]>('/admin/payments'),
  getBanners: () => fetchApi<any[]>('/admin/banners'),
  getFaq: () => fetchApi<any[]>('/admin/faq'),
  getContent: () => fetchApi<any[]>('/admin/content'),
  getCarBrands: () => fetchApi<any[]>('/admin/cars/brands'),
  getCarModels: (brandId: string) => fetchApi<any[]>(`/admin/cars/brands/${brandId}/models`),
  getServiceCategories: () => fetchApi<any[]>('/admin/services/categories'),
  getSupportTickets: () => fetchApi<any[]>('/support/admin/tickets'),
  getSupportTicket: (ticketId: string) => fetchApi<any>(`/support/admin/tickets/${ticketId}`),
  moderateExecutor: (profileId: string, status: 'APPROVED' | 'REJECTED', comment?: string) =>
    fetchApi<any>(`/admin/executors/moderation/${profileId}`, {
      method: 'POST',
      body: JSON.stringify({ status, comment }),
    }),
  toggleUserBlock: (userId: string) => fetchApi<any>(`/admin/users/${userId}/block`, { method: 'POST' }),
  updateUserRole: (userId: string, role: 'CUSTOMER' | 'EXECUTOR' | 'ADMIN') =>
    fetchApi<any>(`/admin/users/${userId}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    }),
  supportsUserRoleUpdate: async () => hasAdminRoleUpdateEndpoint(await fetchApi<any>('/openapi.json')),
  updateContent: (type: 'rules' | 'privacy' | 'templates', content: string) => 
    fetchApi<any>(`/admin/content/${type}`, { method: 'PUT', body: JSON.stringify({ content }) }),
  updateFaq: (faq: any[]) => fetchApi<any>('/admin/content/faq', { method: 'PUT', body: JSON.stringify(faq) }),
  createBanner: (data: any) => fetchApi<any>('/admin/banners', { method: 'POST', body: JSON.stringify(data) }),
  updateBanner: (id: number, data: any) => fetchApi<any>(`/admin/banners/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteBanner: (id: number) => fetchApi<any>(`/admin/banners/${id}`, { method: 'DELETE' }),
  updateCarMake: (id: string, name: string) => fetchApi<any>(`/admin/cars/brands/${id}`, { method: 'PUT', body: JSON.stringify({ name }) }),
  createCarMake: (name: string) => fetchApi<any>('/admin/cars/brands', { method: 'POST', body: JSON.stringify({ name }) }),
  deleteCarMake: (id: string) => fetchApi<any>(`/admin/cars/brands/${id}`, { method: 'DELETE' }),
  updateCarModel: (brandId: string, id: string, name: string) => fetchApi<any>(`/admin/cars/brands/${brandId}/models/${id}`, { method: 'PUT', body: JSON.stringify({ name }) }),
  createCarModel: (brandId: string, name: string) => fetchApi<any>(`/admin/cars/brands/${brandId}/models`, { method: 'POST', body: JSON.stringify({ name }) }),
  deleteCarModel: (brandId: string, id: string) => fetchApi<any>(`/admin/cars/brands/${brandId}/models/${id}`, { method: 'DELETE' }),
  updateContractor: (id: string, data: any) => fetchApi<any>(`/admin/executors/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  updateServiceCategories: (categories: any[]) => fetchApi<any>('/admin/services/categories', { method: 'PUT', body: JSON.stringify(categories) }),
  resolveSupportTicket: (id: string | number) => fetchApi<any>(`/support/admin/tickets/${id}/close`, { method: 'POST' }),
  replySupportTicket: (id: string | number, text: string) => fetchApi<any>(`/support/admin/tickets/${id}/messages`, { method: 'POST', body: JSON.stringify({ content: text }) }),
};

// --- Payments ---
export const paymentsApi = {
  checkout: (amount: number, purpose: 'CUSTOMER_ACCESS' | 'PROFI_SUB' | 'LEADER_SUB') =>
    fetchApi<{ payment_url: string }>('/payments/checkout', {
      method: 'POST',
      body: JSON.stringify({ amount, purpose }),
    }),
};

// --- Misc ---
export const miscApi = {
  getFaq: () => fetchApi<any[]>('/faq'),
  getSupport: () => fetchApi<any>('/support'),
  getBanners: (position?: string) => fetchApi<any[]>(`/banners${position ? `?position=${position}` : ''}`),
  getContent: (key: 'rules' | 'privacy' | 'templates') => fetchApi<{ key: string; value: string }>(`/content/${key}`),
};

// --- Support ---
export const supportApi = {
  createTicket: (data: { subject: string; message: string; attachments?: string[] }) =>
    fetchApi<any>('/support/tickets', { method: 'POST', body: JSON.stringify(data) }),
  getTickets: (page: number = 1, perPage: number = 20) =>
    fetchApi<any>(`/support/tickets?page=${page}&per_page=${perPage}`),
  getTicket: (ticketId: string) => fetchApi<any>(`/support/tickets/${ticketId}`),
  sendMessage: (ticketId: string, content: string, attachments?: string[]) =>
    fetchApi<any>(`/support/tickets/${ticketId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content, attachments }),
    }),
  closeTicket: (ticketId: string) => fetchApi<any>(`/support/tickets/${ticketId}/close`, { method: 'POST' }),
};
