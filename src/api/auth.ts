const API_BASE =
  // Vite-подобная переменная окружения (frontend)
  ((typeof import.meta !== 'undefined' &&
    (import.meta as any).env &&
    (import.meta as any).env.VITE_API_URL) as string | undefined) ||
  // Глобальный URL (может быть выставлен в docker/jest через globalThis.__NF_API_URL__)
  (typeof globalThis !== 'undefined' &&
    (globalThis as any).__NF_API_URL__) ||
  // Fallback для тестов/Node-среды: process.env.*
  ((typeof process !== 'undefined' &&
    (process as any).env &&
    ((process as any).env.NF_API_URL ||
      (process as any).env.VITE_API_URL)) as string | undefined) ||
  '/api';

const TOKEN_KEY = 'nf_token';

export const setToken = (token: string): void => {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // ignore
  }
};

export const getToken = (): string | null => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

export const clearToken = (): void => {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // ignore
  }
};

interface LoginResponse {
  token: string;
}

export async function login(email: string, password: string): Promise<string> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    throw new Error('Неверный email или пароль');
  }

  const data = (await res.json()) as LoginResponse;
  if (!data.token) {
    throw new Error('Некорректный ответ сервера');
  }

  setToken(data.token);
  return data.token;
}

export interface MeResponse {
  id: string;
  email: string;
  name: string | null;
}

export async function getMe(): Promise<MeResponse> {
  const token = getToken();
  const res = await fetch(`${API_BASE}/auth/me`, {
    headers: token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : undefined,
  });

  if (res.status === 401) {
    throw new Error('Unauthorized');
  }

  if (!res.ok) {
    throw new Error('Failed to load current user');
  }

  return (await res.json()) as MeResponse;
}