# NutriFlow Web

Frontend части проекта NutriFlow теперь собирается через [Vite](https://vitejs.dev/) и готова к выкладке на Vercel.

## Локальная разработка

```bash
npm install
npm run dev     # http://localhost:5173
npm test        # jest + react-testing-library
npm run build   # typecheck + production сборка
```

## Деплой на Vercel

1. Создайте новый Vercel Project и укажите репозиторий `remardo/nutriflow1`.
2. В разделе _Build & Development Settings_ оставьте:
   - **Framework Preset**: Vite (либо `Other` с `npm run build`)
   - **Install Command**: `npm install`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. Если требуется доступ к API, задайте переменную окружения `VITE_API_URL`.
4. Запустите деплой — Vercel возьмёт готовый `vercel.json` и настроит SPA-фолбек (`/(.*) -> /index.html`).

После первого деплоя Vercel запомнит настройки, и достаточно будет пушить изменения в `main`.
