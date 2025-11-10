# NutriFlow Backend

Цель: backend для системы мониторинга питания NutriFlow без Telegram-бота на первом этапе. Обеспечивает API для:
- дэшборда нутрициолога;
- списка и профилей клиентов;
- питания (Meal, ClientDayStats);
- лабораторных анализов;
- меню и рекомендаций;
- событий и напоминаний;
- тарифов и ограничений.

## Технологический стек

- Node.js + TypeScript.
- HTTP-фреймворк: Express.
- ORM: Prisma + PostgreSQL.
- Auth: JWT (nutriolog-only, без сложной RBAC на первом этапе).
- Тесты: Jest.

## Структура

- [`backend/src/app.ts`](backend/src/app.ts:1) — точка входа HTTP-сервера.
- [`backend/src/modules`](backend/src/modules:1)
  - `auth` — аутентификация и текущий пользователь.
  - `clients` — клиенты и профиль.
  - `labs` — лабораторные анализы.
  - `menu` — меню и назначения.
  - `events` — события и напоминания.
  - `billing` — тарифы и лимиты.
- [`backend/src/middleware/auth.ts`](backend/src/middleware/auth.ts:1) — JWT-мидлвар для защищённых маршрутов.
- [`backend/prisma`](backend/prisma/schema.prisma:1) — схема БД и миграции.

## Окружение

Обязательные переменные (минимум):

```bash
DATABASE_URL="postgresql://user:password@localhost:5432/nutriflow"
JWT_SECRET="your-secure-jwt-secret"
```

Для локальной разработки при отсутствии `JWT_SECRET` используется dev-secret (не использовать в продакшене).

## Установка и запуск (локально)

1. Установка зависимостей:

```bash
cd backend
npm install
```

2. Применение миграций Prisma:

```bash
npx prisma migrate dev
```

(Команда не запускается автоматически, выполнить вручную после изменения схемы, включая добавление `User.hashedPassword`.)

3. Запуск dev-сервера:

```bash
npm run dev
```

По умолчанию backend слушает `http://localhost:4000`.

## Auth / JWT

### Модель User

См. [`backend/prisma/schema.prisma`](backend/prisma/schema.prisma:10):

- `email` — уникальный логин.
- `hashedPassword` — обязательный hash пароля (bcrypt).
- `name` — опциональное имя.

### Маршруты аутентификации

Реализованы в [`backend/src/modules/auth.ts`](backend/src/modules/auth.ts:1) и подключены в [`backend/src/app.ts`](backend/src/app.ts:1).

- `POST /api/auth/login`
  - Body: `{ "email": string, "password": string }`
  - Логика:
    - найти `User` по `email`;
    - проверить `password` через `bcrypt.compare` с `hashedPassword`;
    - при успехе вернуть `{ token }`, где `token` — JWT с payload `{ userId }`, срок действия `7d`;
    - секрет — `JWT_SECRET` (для dev есть безопасный fallback).
  - Ответы:
    - `200` `{ token }`
    - `400` при отсутствии полей
    - `401` при неверных кредах

- `GET /api/auth/me`
  - Требует заголовок `Authorization: Bearer <token>`.
  - Использует `req.user.id`, выставленный мидлварой.
  - Возвращает `{ id, email, name }`.
  - Ответы:
    - `200` при валидном токене
    - `401` если нет/невалидный токен
    - `404` если пользователь не найден

### Middleware: authRequired

[`backend/src/middleware/auth.ts`](backend/src/middleware/auth.ts:1):

- Читает `Authorization: Bearer <token>`.
- Валидирует JWT с помощью `JWT_SECRET`.
- В случае успеха:
  - `req.user = { id: userId }`.
- В случае ошибки:
  - `401 { error: 'Invalid or expired token' }`.

### Защита основных маршрутов

В [`backend/src/app.ts`](backend/src/app.ts:1):

1. Публичный доступ к auth:

```ts
app.use('/api', authRouter);
```

2. После этого все ключевые бизнес-модули обёрнуты `authRequired`:

```ts
app.use('/api/clients', authRequired, clientsRouter);
app.use('/api/dashboard', authRequired, dashboardRouter);
app.use('/api', authRequired, labsRouter);
app.use('/api', authRequired, menuRouter);
app.use('/api', authRequired, eventsRouter);
app.use('/api', authRequired, billingRouter);
```

Так сохранены существующие контракты URL, но доступ к данным требует валидного JWT.

## Создание тестового пользователя (локально)

Пример через Prisma Client и bcrypt (выполнить один раз):

```bash
cd backend
npx ts-node
```

В REPL:

```ts
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const password = 'admin123';
  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      email: 'admin@example.com',
      name: 'Admin',
      hashedPassword,
    },
  });

  console.log('Created user:', user);
}

main().finally(() => prisma.$disconnect());
```

После создания:
- Логин: `admin@example.com`
- Пароль: `admin123`
- Использовать для `POST /api/auth/login`, затем токен — для всех защищённых `/api`-эндпоинтов.