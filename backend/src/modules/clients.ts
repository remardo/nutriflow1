import { Router, Response } from 'express';
import { PrismaClient, ClientStatus } from '@prisma/client';
import { AuthenticatedRequest } from '../middleware/auth';

const prisma = new PrismaClient();
export const clientsRouter = Router();

/**
 * GET /api/clients
 * Список клиентов только текущего пользователя/тенанта
 * с базовыми метриками и флагами рисков.
 */
clientsRouter.get('/', async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const user = req.user;

  const where: any = {};

  // OWNER/ADMIN с tenantId: видят всех клиентов своего tenant
  if ((user.role === 'OWNER' || user.role === 'ADMIN') && user.tenantId) {
    where.tenantId = user.tenantId;
  } else {
    // NUTRITIONIST — только свои клиенты;
    // fallback OWNER/ADMIN без tenantId — тоже только свои.
    where.userId = user.id;
  }

  const clients = await prisma.client.findMany({
    where,
    include: {
      dayStats: {
        orderBy: { date: 'desc' },
        take: 1,
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const mapped = clients.map((c) => toClientSummary(c));

  res.json(mapped);
});

/**
 * GET /api/clients/:id/profile
 * Агрегированный профиль клиента под текущий фронт.
 */
clientsRouter.get('/:id/profile', async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      norms: true,
      dayStats: {
        orderBy: { date: 'desc' },
        take: 1,
      },
      labTests: {
        orderBy: { takenAt: 'desc' },
        take: 10,
      },
      menuAssignments: {
        where: { isActive: true },
        include: { menuTemplate: true },
        orderBy: { startDate: 'desc' },
        take: 1,
      },
      events: {
        orderBy: { scheduledAt: 'asc' },
        take: 10,
      },
    },
  });

  if (!client) {
    return res.status(404).json({ error: 'Client not found' });
  }

  // Авторизация доступа к клиенту по RBAC/tenant:
  // - OWNER/ADMIN с tenantId: клиент того же tenant (если поле tenantId есть)
  // - NUTRITIONIST: только свои клиенты (и при наличии tenantId — внутри tenant)
  // - fallback: только свои клиенты
  // - при нарушении — 404 для маскировки
  if (req.user) {
    const user = req.user;
    const isOwnerOrAdmin = user.role === 'OWNER' || user.role === 'ADMIN';
    const sameUser = (client as any).userId === user.id;
    const clientTenantId = (client as any).tenantId as string | null | undefined;

    let allowed = false;

    if (isOwnerOrAdmin && user.tenantId) {
      // Если у клиента есть tenantId — должен совпасть.
      // Если в модели его нет, оставляем доступным (демо-одиночный tenant).
      allowed = clientTenantId ? clientTenantId === user.tenantId : true;
    } else if (user.role === 'NUTRITIONIST') {
      allowed = sameUser && (!user.tenantId || !clientTenantId || clientTenantId === user.tenantId);
    } else {
      // OWNER/ADMIN без tenantId — только свои клиенты
      allowed = sameUser;
    }

    if (!allowed) {
      return res.status(404).json({ error: 'Client not found' });
    }
  }

  const latestStats = client.dayStats[0];

  res.json({
    id: client.id,
    name: client.fullName,
    status: client.status === ClientStatus.ACTIVE ? 'active' : 'paused',
    goal: client.goal,
    norms: client.norms ?? null,
    dayStats: latestStats ?? null,
    labs: client.labTests,
    activeMenu: client.menuAssignments[0] ?? null,
    events: client.events
  });
});

/**
 * PUT /api/clients/:id/norms
 * Создать или обновить ClientNutrientNorms для клиента.
 * Принимает часть полей; хотя бы одно должно быть передано.
 */
clientsRouter.put('/:id/norms', async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const {
    kcalMin,
    kcalMax,
    proteinGrams,
    fatGramsMin,
    fatGramsMax,
    carbsGramsMin,
    carbsGramsMax,
    fiberGrams
  } = req.body || {};

  const payload = {
    kcalMin,
    kcalMax,
    proteinGrams,
    fatGramsMin,
    fatGramsMax,
    carbsGramsMin,
    carbsGramsMax,
    fiberGrams
  };

  const hasAtLeastOneField = Object.values(payload).some(
    (v) => v !== undefined
  );

  if (!hasAtLeastOneField) {
    return res
      .status(400)
      .json({ error: 'At least one norm field must be provided' });
  }

  // Простейшая runtime-валидация типов (числа или undefined/null)
  const numericKeys = [
    'kcalMin',
    'kcalMax',
    'proteinGrams',
    'fatGramsMin',
    'fatGramsMax',
    'carbsGramsMin',
    'carbsGramsMax',
    'fiberGrams'
  ] as const;

  for (const key of numericKeys) {
    const value = (payload as any)[key];
    if (
      value !== undefined &&
      value !== null &&
      (typeof value !== 'number' || Number.isNaN(value))
    ) {
      return res
        .status(400)
        .json({ error: `Field ${key} must be a number if provided` });
    }
  }

  // Убедимся, что клиент существует
  const client = await prisma.client.findUnique({ where: { id } });
  if (!client) {
    return res.status(404).json({ error: 'Client not found' });
  }

  // Проверка владения при изменении норм
  if (req.user) {
    const sameUser = client.userId === req.user.id;
    const sameTenant =
      (client as any).tenantId && req.user.tenantId
        ? (client as any).tenantId === req.user.tenantId
        : false;

    if (!sameUser && !sameTenant) {
      return res.status(404).json({ error: 'Client not found' });
    }
  }

  // Обновление или создание норм
  const existing = await prisma.clientNutrientNorms.findUnique({
    where: { clientId: id }
  });

  let norms;
  if (existing) {
    norms = await prisma.clientNutrientNorms.update({
      where: { clientId: id },
      data: payload
    });
  } else {
    norms = await prisma.clientNutrientNorms.create({
      data: {
        clientId: id,
        ...payload
      }
    });
  }

  // Возвращаем обновлённый профиль клиента
  const updated = await prisma.client.findUnique({
    where: { id },
    include: {
      norms: true,
      dayStats: {
        orderBy: { date: 'desc' },
        take: 1
      },
      labTests: {
        orderBy: { takenAt: 'desc' },
        take: 10
      },
      menuAssignments: {
        where: { isActive: true },
        include: { menuTemplate: true },
        orderBy: { startDate: 'desc' },
        take: 1
      },
      events: {
        orderBy: { scheduledAt: 'asc' },
        take: 10
      }
    }
  });

  if (!updated) {
    return res.status(500).json({ error: 'Failed to load updated client' });
  }

  const latestStatsUpdated = updated.dayStats[0];

  res.json({
    id: updated.id,
    name: updated.fullName,
    status: updated.status === ClientStatus.ACTIVE ? 'active' : 'paused',
    goal: updated.goal,
    norms: updated.norms ?? null,
    dayStats: latestStatsUpdated ?? null,
    labs: updated.labTests,
    activeMenu: updated.menuAssignments[0] ?? null,
    events: updated.events
  });
});

/**
 * Helper: маппинг Client + latest dayStats -> ClientSummary для /api/clients.
 * Вынесен отдельно для unit-тестов.
 */
export type ClientSummaryDto = {
  id: string;
  name: string;
  status: 'active' | 'paused';
  goal: string | null;
  proteinCoverage: number;
  fiberCoverage: number;
  kcalCoverage: number;
  riskFlags: string[];
};

type ClientWithLatestStats = {
  id: string;
  fullName: string;
  status: ClientStatus;
  goal: string | null;
  dayStats: {
    proteinCoverage: number | null;
    fiberCoverage: number | null;
    kcalCoverage: number | null;
    riskFlags: string[] | null;
  }[];
};

export function toClientSummary(client: ClientWithLatestStats): ClientSummaryDto {
  const latest = client.dayStats[0];

  const proteinCoverage = latest?.proteinCoverage ?? null;
  const fiberCoverage = latest?.fiberCoverage ?? null;
  const kcalCoverage = latest?.kcalCoverage ?? null;

  const riskFlags: string[] = [];

  if (proteinCoverage !== null && proteinCoverage < 0.85) {
    riskFlags.push('proteinLow');
  }
  if (fiberCoverage !== null && fiberCoverage < 0.85) {
    riskFlags.push('fiberLow');
  }
  if (riskFlags.length === 0) {
    riskFlags.push('ok');
  }

  return {
    id: client.id,
    name: client.fullName,
    status: client.status === ClientStatus.ACTIVE ? 'active' : 'paused',
    goal: client.goal,
    proteinCoverage: proteinCoverage ?? 1,
    fiberCoverage: fiberCoverage ?? 1,
    kcalCoverage: kcalCoverage ?? 1,
    riskFlags,
  };
}