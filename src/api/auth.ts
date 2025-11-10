import {
  demoAuthenticate,
  demoGetCurrentUser,
  isDemoModeEnabled,
  shouldUseDemoFallback,
  DEMO_TOKEN,
} from './demoMode';

const API_BASE =
  ((typeof import.meta !== 'undefined' &&
    (import.meta as any).env &&
    (import.meta as any).env.VITE_API_URL) as string | undefined) ||
  (typeof globalThis !== 'undefined' &&
    (globalThis as any).__NF_API_URL__) ||
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

async function loginRemote(email: string, password: string): Promise<string> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    if (res.status === 401) {
      throw new Error('Неверный email или пароль');
    }
    const err = new Error('Auth service недоступен');
    (err as any).status = res.status;
    throw err;
  }

  const data = (await res.json()) as LoginResponse;
  if (!data.token) {
    throw new Error('Сервис вернул пустой токен');
  }

  setToken(data.token);
  return data.token;
}

export async function login(email: string, password: string): Promise<string> {
  try {
    return await loginRemote(email, password);
  } catch (err) {
    if (shouldUseDemoFallback(err)) {
      const demo = demoAuthenticate(email, password);
      setToken(demo.token);
      return demo.token;
    }
    throw err;
  }
}

export interface MeResponse {
  id: string;
  email: string;
  name: string | null;
}

export async function getMe(): Promise<MeResponse> {
  const token = getToken();
  if (token === DEMO_TOKEN && isDemoModeEnabled()) {
    return demoGetCurrentUser();
  }
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
    if (shouldUseDemoFallback(res)) {
      return demoGetCurrentUser();
    }
    throw new Error('Failed to load current user');
  }

  return (await res.json()) as MeResponse;
}
