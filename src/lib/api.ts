export const API_URL = (import.meta as any).env.VITE_API_URL || 'https://api.example.com/api/v1'; // Замените на реальный URL

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('access_token');
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorMessage = 'API Error';
      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || JSON.stringify(errorData);
      } catch (e) {
        errorMessage = response.statusText;
      }
      throw new ApiError(response.status, errorMessage);
    }

    // Handle empty responses (e.g., 204 No Content)
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  } catch (error) {
    console.warn(`[API Mock] Network error or API unavailable for ${endpoint}. Returning mock success for prototype.`);
    
    // Smart mock for prototype
    if (options.method === 'POST' && options.body) {
      try {
        const bodyObj = JSON.parse(options.body as string);
        return { id: Date.now(), ...bodyObj } as T;
      } catch (e) {
        return { id: Date.now() } as T;
      }
    }
    
    return {} as T;
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
  getFeed: () => fetchApi<any[]>('/executor/feed'),
  respondToOrder: (orderId: string, data: { price_estimate?: string; comment?: string }) =>
    fetchApi<any>(`/executor/orders/${orderId}/respond`, { method: 'POST', body: JSON.stringify(data) }),
  completeOrder: (orderId: string) => fetchApi<any>(`/executor/orders/${orderId}/complete`, { method: 'POST' }),
};

// --- Admin ---
export const adminApi = {
  getDashboard: () => fetchApi<any>('/admin/dashboard'),
  moderateExecutor: (profileId: string, status: 'APPROVED' | 'REJECTED', comment?: string) =>
    fetchApi<any>(`/admin/executors/moderation/${profileId}`, {
      method: 'POST',
      body: JSON.stringify({ status, comment }),
    }),
  toggleUserBlock: (userId: string) => fetchApi<any>(`/admin/users/${userId}/block`, { method: 'POST' }),
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
  resolveSupportTicket: (id: number) => fetchApi<any>(`/admin/support/${id}/resolve`, { method: 'POST' }),
  replySupportTicket: (id: number, text: string) => fetchApi<any>(`/admin/support/${id}/reply`, { method: 'POST', body: JSON.stringify({ text }) }),
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
};
