import request from 'supertest';
import express from 'express';
import { dashboardRouter } from './dashboard';

/**
 * Мокаем PrismaClient для изоляции от реальной БД.
 * Тест проверяет форму ответа summary и наличие ключевых агрегатов.
 */

jest.mock('@prisma/client', () => {
  const prismaMock = {
    client: {
      findMany: jest.fn(),
    },
    event: {
      findMany: jest.fn(),
    },
    menuAssignment: {
      findMany: jest.fn(),
    },
    labTest: {
      findMany: jest.fn(),
    },
  };

  return {
    PrismaClient: jest.fn(() => prismaMock),
    ClientStatus: {
      ACTIVE: 'ACTIVE',
      PAUSED: 'PAUSED',
    },
    // Экспортируем mock для использования в тестах
    __esModule: true,
    default: {},
    prismaMock,
  };
});

// Достаём prismaMock из мокнутого модуля
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { prismaMock } = require('@prisma/client');

describe('GET /api/dashboard/summary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('возвращает агрегированную сводку с ожидаемыми полями', async () => {
    // Мокаем клиентов и dayStats
    prismaMock.client.findMany.mockResolvedValue([
      {
        id: 'c1',
        status: 'ACTIVE',
        dayStats: [{ riskFlags: ['ok'] }],
      },
      {
        id: 'c2',
        status: 'PAUSED',
        dayStats: [{ riskFlags: ['proteinLow', 'fiberLow'] }],
      },
    ]);

    // Мокаем события
    prismaMock.event.findMany.mockResolvedValue([
      {
        id: 'e1',
        clientId: 'c1',
        title: 'Check-in',
        scheduledAt: new Date().toISOString(),
        channel: 'telegram',
        type: 'call',
      },
    ]);

    // Мокаем активные меню
    prismaMock.menuAssignment.findMany.mockResolvedValue([
      { clientId: 'c1', isActive: true },
    ]);

    // Мокаем лабораторные тесты (два LOW по одному клиенту)
    prismaMock.labTest.findMany.mockResolvedValue([
      { clientId: 'c2' },
      { clientId: 'c2' },
    ]);

    const app = express();
    app.use('/api/dashboard', dashboardRouter);

    const res = await request(app).get('/api/dashboard/summary');

    expect(res.status).toBe(200);

    const body = res.body;

    // Базовые поля
    expect(body).toHaveProperty('totalClients', 2);
    expect(body).toHaveProperty('activeClients', 1);

    // Риски
    expect(body).toHaveProperty('risks');
    expect(body.risks).toEqual(
      expect.objectContaining({
        ok: expect.any(Number),
        proteinLow: expect.any(Number),
        fiberLow: expect.any(Number),
        overKcal: expect.any(Number),
      })
    );

    // События
    expect(body).toHaveProperty('eventsUpcomingCount', 1);
    expect(body).toHaveProperty('events');
    expect(Array.isArray(body.events)).toBe(true);
    expect(body.events[0]).toEqual(
      expect.objectContaining({
        id: 'e1',
        clientId: 'c1',
        title: 'Check-in',
        scheduledAt: expect.any(String),
        channel: 'telegram',
        type: 'call',
      })
    );

    // Меню
    expect(body).toHaveProperty('menu');
    expect(body.menu).toEqual(
      expect.objectContaining({
        clientsWithActiveMenu: expect.any(Number),
      })
    );

    // Лабы
    expect(body).toHaveProperty('labs');
    expect(body.labs).toEqual(
      expect.objectContaining({
        lowRiskClients: expect.any(Number),
      })
    );
  });
});