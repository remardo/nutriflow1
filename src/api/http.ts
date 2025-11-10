import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { getToken } from './auth';

/**
 * Централизованный baseURL:
 * - сначала import.meta.env.VITE_API_URL (Vite-like),
 * - затем window.__NF_API_URL__ (для docker/docker-compose),
 * - fallback: http://localhost:4000/api
 */
const API_BASE: string =
  // Vite-подобная переменная окружения (при сборке фронта)
  ((typeof import.meta !== 'undefined' &&
    (import.meta as any).env &&
    (import.meta as any).env.VITE_API_URL) as string | undefined) ||
  // Глобальная переменная для docker/docker-compose и jest
  ((typeof globalThis !== 'undefined' &&
    (globalThis as any).__NF_API_URL__) as string | undefined) ||
  // Fallback для jest / node-среды: через process.env без прямого доступа к import.meta
  ((typeof process !== 'undefined' &&
    (process as any).env &&
    ((process as any).env.NF_API_URL ||
      (process as any).env.VITE_API_URL)) as string | undefined) ||
  'http://localhost:4000/api';

export const apiBaseUrl = API_BASE;

/**
 * Единый axios-инстанс.
 * Не меняем публичные сигнатуры существующих API-helpers:
 * они просто используют этот инстанс вместо создания своих.
 */
const httpClient: AxiosInstance = axios.create({
  baseURL: API_BASE,
});

/**
 * Interceptor: автоматически подставляет Bearer-токен из хранилища.
 */
httpClient.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers = config.headers || {};
    (config.headers as any).Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Унифицированный helper для fetch-подобного использования при необходимости.
 * Используется только там, где уже был fetch и важна совместимость.
 */
export async function apiFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const url = `${API_BASE}${path}`;
  const token = getToken();

  const headers: Record<string, string> = {
    ...(options.headers as any),
  };

  if (
    options.body &&
    !Object.keys(headers).some(
      (k) => k.toLowerCase() === 'content-type'
    )
  ) {
    headers['Content-Type'] = 'application/json';
  }

  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return fetch(url, {
    ...options,
    headers,
  });
}

/**
 * Лёгкая обёртка над httpClient для типизированных запросов.
 */
export function http<T = any>(config: AxiosRequestConfig): Promise<T> {
  return httpClient(config).then((res) => res.data as T);
}

export { httpClient };