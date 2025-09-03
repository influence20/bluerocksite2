import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token and redirect to login
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    country?: string;
  }) => api.post('/auth/register', data),

  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),

  adminLogin: (data: { email: string; password: string }) =>
    api.post('/auth/admin/login', data),

  forgotPassword: (data: { email: string }) =>
    api.post('/auth/forgot-password', data),

  resetPassword: (data: { token: string; password: string }) =>
    api.post('/auth/reset-password', data),
};

// User API
export const userAPI = {
  getDashboard: () => api.get('/user/dashboard'),
  
  submitDeposit: (data: {
    amount: number;
    cryptoType: string;
    transactionId?: string;
    walletAddress: string;
  }) => api.post('/user/deposit', data),

  requestWithdrawal: (data: {
    amount: number;
    cryptoType: string;
    walletAddress: string;
  }) => api.post('/user/withdrawal', data),

  submitWithdrawalPin: (withdrawalId: string, pin: string) =>
    api.post(`/user/withdrawal/${withdrawalId}/pin`, { pin }),

  getTransactions: (params?: {
    page?: number;
    limit?: number;
    type?: string;
    startDate?: string;
    endDate?: string;
  }) => api.get('/user/transactions', { params }),

  getInvestments: () => api.get('/user/investments'),

  updateProfile: (data: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    country?: string;
  }) => api.put('/user/profile', data),

  exportTransactions: (params?: {
    startDate?: string;
    endDate?: string;
  }) => api.get('/user/transactions/export/csv', { 
    params,
    responseType: 'blob',
  }),
};

// Investment API
export const investmentAPI = {
  getCalculator: (amount: number) =>
    api.get('/investment/calculator', { params: { amount } }),

  getExamples: () => api.get('/investment/examples'),

  getWallets: () => api.get('/investment/wallets'),

  getPlans: () => api.get('/investment/plans'),

  getPlan: (id: string) => api.get(`/investment/plans/${id}`),

  getStats: () => api.get('/investment/stats'),
};

// Transaction API
export const transactionAPI = {
  getTransactions: (params?: {
    page?: number;
    limit?: number;
    type?: string;
    startDate?: string;
    endDate?: string;
  }) => api.get('/transaction', { params }),

  getSummary: (period?: string) =>
    api.get('/transaction/summary', { params: { period } }),

  getTransaction: (id: string) => api.get(`/transaction/${id}`),

  exportCSV: (params?: {
    startDate?: string;
    endDate?: string;
  }) => api.get('/transaction/export/csv', { 
    params,
    responseType: 'blob',
  }),
};

// Admin API
export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),

  getUsers: (params?: {
    page?: number;
    limit?: number;
    search?: string;
  }) => api.get('/admin/users', { params }),

  getPendingDeposits: () => api.get('/admin/deposits/pending'),

  confirmDeposit: (id: string, data?: { transactionId?: string }) =>
    api.post(`/admin/deposits/${id}/confirm`, data),

  rejectDeposit: (id: string, reason: string) =>
    api.post(`/admin/deposits/${id}/reject`, { reason }),

  getPendingWithdrawals: () => api.get('/admin/withdrawals/pending'),

  generateWithdrawalPin: (id: string) =>
    api.post(`/admin/withdrawals/${id}/generate-pin`),

  approveWithdrawal: (id: string, transactionId: string) =>
    api.post(`/admin/withdrawals/${id}/approve`, { transactionId }),

  getAuditLogs: (params?: {
    page?: number;
    limit?: number;
    action?: string;
    entity?: string;
  }) => api.get('/admin/audit-logs', { params }),

  createAdminUser: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: string;
  }) => api.post('/admin/users', data),
};

// Public API
export const publicAPI = {
  contact: (data: {
    name: string;
    email: string;
    subject: string;
    message: string;
  }) => api.post('/public/contact', data),

  getInvestmentExamples: () => api.get('/public/investment-examples'),

  getWallets: () => api.get('/public/wallets'),

  subscribeNewsletter: (email: string) =>
    api.post('/public/newsletter', { email }),

  getStats: () => api.get('/public/stats'),

  healthCheck: () => api.get('/public/health'),
};

export default api;