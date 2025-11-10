import { Router, Response } from 'express';
import { PrismaClient, ClientStatus } from '@prisma/client';
import { AuthenticatedRequest } from '../middleware/auth';

const prisma = new PrismaClient();
export const dashboardRouter = Router();

/**
 * GET /api/dashboard/summary
 * Агрегированная сводка для дэшборда в контексте текущего пользователя/тенанта:
 * - количество клиентов
 * - активные клиенты
 * - распределение рисков по последним dayStats
 * - ближайшие события
 */
dashboardRouter.get('/summary', async (req: AuthenticatedRequest, res: Response) => {
  const clientWhere: any = {};

  if (req.user?.tenantId) {
    clientWhere.tenantId = req.user.tenantId;
  } else if (req.user?.id) {
    clientWhere.userId = req.user.id;
  }

  // Клиенты и их последние dayStats только в рамках текущего пользователя/тенанта
  const clients = await prisma.client.findMany({
    where: clientWhere,
    include: {
      dayStats: {
        orderBy: { date: 'desc' },
        take: 1,
      },
    },
  });

  const totalClients = clients.length;
  const activeClients = clients.filter(
    (c) => c.status === ClientStatus.ACTIVE
  ).length;

  let ok = 0;
  let proteinLow = 0;
  let fiberLow = 0;
  let overKcal = 0;

  clients.forEach((c) => {
    const latest = c.dayStats[0];
    if (!latest) {
      ok += 1;
      return;
    }
    const flags = latest.riskFlags || [];
    if (flags.includes('proteinLow')) proteinLow += 1;
    if (flags.includes('fiberLow')) fiberLow += 1;
    if (flags.includes('overKcal')) overKcal += 1;
    if (flags.includes('ok') || flags.length === 0) ok += 1;
  });

  const percent = (value: number) =>
    totalClients ? Math.round((value / totalClients) * 100) : 0;

  // Ближайшие события (7 дней вперёд) в рамках тех же клиентов
  const now = new Date();
  const in7days = new Date();
  in7days.setDate(now.getDate() + 7);

  const upcomingEvents = await prisma.event.findMany({
    where: {
      scheduledAt: {
        gte: now,
        lte: in7days,
      },
      // если клиент привязан — фильтруем по тем же клиентам
      ...(clients.length
        ? { clientId: { in: clients.map((c) => c.id) } }
        : {}),
    },
    orderBy: { scheduledAt: 'asc' },
    take: 20,
  });

  // Клиенты с активным меню (в рамках видимых клиентов)
  const clientsWithActiveMenu = await prisma.menuAssignment.findMany({
    where: {
      isActive: true,
      ...(clients.length
        ? { clientId: { in: clients.map((c) => c.id) } }
        : {}),
    },
    distinct: ['clientId'],
  });
  const clientsWithActiveMenuCount = clientsWithActiveMenu.length;

  // Базовые сигналы по лабораторным тестам:
  // сколько уникальных клиентов имеют хотя бы один LOW по ключевым маркерам
  const keyLowMarkers = await prisma.labTest.findMany({
    where: {
      status: 'LOW',
      marker: {
        in: ['Ferritin', 'VitaminD', 'B12'],
      },
      ...(clients.length
        ? { clientId: { in: clients.map((c) => c.id) } }
        : {}),
    },
    select: { clientId: true },
  });
  const lowRiskClientIds = Array.from(
    new Set(keyLowMarkers.map((t) => t.clientId))
  );
  const lowRiskClientsCount = lowRiskClientIds.length;

  res.json({
    totalClients,
    activeClients,
    risks: {
      ok: percent(ok),
      proteinLow: percent(proteinLow),
      fiberLow: percent(fiberLow),
      overKcal: percent(overKcal),
    },
    eventsUpcomingCount: upcomingEvents.length,
    events: upcomingEvents.map((e) => ({
      id: e.id,
      clientId: e.clientId,
      title: e.title,
      scheduledAt: e.scheduledAt,
      channel: e.channel,
      type: e.type,
    })),
    menu: {
      clientsWithActiveMenu: clientsWithActiveMenuCount,
    },
    labs: {
      lowRiskClients: lowRiskClientsCount,
    },
  });
});