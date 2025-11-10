import '@testing-library/jest-dom';

// Глобовый URL для api/http.ts и api/auth.ts в среде jest,
// чтобы избежать прямого обращения к import.meta.
if (typeof globalThis !== 'undefined') {
  (globalThis as any).__NF_API_URL__ =
    (globalThis as any).__NF_API_URL__ || 'http://localhost:4000/api';
}

// Явный мок import.meta для jest (CommonJS окружение), чтобы выражения
// вида typeof import.meta не падали парсером.
(globalThis as any).import = (globalThis as any).import || {};

// polyfill TextEncoder/TextDecoder для react-router / jsdom
import { TextEncoder, TextDecoder } from 'util';

(global as any).TextEncoder = TextEncoder;
(global as any).TextDecoder = TextDecoder;

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: any) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});