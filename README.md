# NutriFlow Web

Фронтенд NutriFlow работает на базе [Vite](https://vitejs.dev/) и может функционировать как с реальным backend API, так и в автономном демо-режиме.

## Быстрый старт

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # jest + RTL
npm run build    # typecheck + production сборка
```

## Demo-режим (включён по умолчанию)

- Логин: `admin@example.com`
- Пароль: `admin123`
- Данные клиентов, лабораторных показателей и меню берутся из `src/api/demoMode.ts` и сохраняются в `localStorage`. Сброс — очищением хранилища или вызовом `resetDemoState()` в DevTools.
- Если нужно запретить работу мок-API, задайте `VITE_ENABLE_DEMO=false` (например, в `.env.local` или настройках Vercel).

## Подключение реального backend API

1. В каталоге `backend/`:
   ```bash
   npm install
   npm run prisma db seed  # создаст admin@example.com / admin123
   npm run dev             # или docker-compose up
   ```
2. На фронтенде задайте base URL:
   - локально: `.env.local` с `VITE_API_URL=http://localhost:4000/api`
   - на Vercel: переменная проекта `VITE_API_URL=https://<host>/api`
3. (Опционально) оставьте demo-режим как автоматический fallback на ошибки 404/405/5xx или отключите его переменной `VITE_ENABLE_DEMO=false`.

## Деплой на Vercel

1. Подключите репозиторий `remardo/nutriflow1`.
2. Настройки Build & Output:
   - Framework: `Vite`
   - Install: `npm install`
   - Build: `npm run build`
   - Output: `dist`
3. Для SPA навигации используется `vercel.json` (файлы с расширением отдаются напрямую, остальные маршруты → `index.html`).
4. Добавьте нужные переменные окружения (`VITE_API_URL`, `VITE_ENABLE_DEMO`, при необходимости ключи авторизации).

После пуша в `main` Vercel автоматически создаёт превью и прод-деплой.
