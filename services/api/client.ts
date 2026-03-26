import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';

import { apiBaseUrl } from '@/lib/env';
import { tokenStorage } from '@/services/auth/token-storage';

export const apiClient = axios.create({
  baseURL: `${apiBaseUrl}/api`,
  timeout: 15_000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = await tokenStorage.getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      await tokenStorage.clear();
    }
    return Promise.reject(error);
  },
);
