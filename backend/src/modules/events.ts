import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '../middleware/auth';
import { assertClientAccess } from '../utils/access';

const prisma = new PrismaClient();
export const eventsRouter = Router();

/**
 * GET /api/clients/:id/events
 * Список событий по клиенту (по умолчанию упорядочен по времени).
 */
eventsRouter.get(
  '/clients/:id/events',
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id: clientId } = req.params;

    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: {
        id: true,
        userId: true,
      },
    });

    if (!client || !assertClientAccess(req.user, client as any)) {
      return res.status(404).json({ error: 'Client not found' });
    }

    const events = await prisma.event.findMany({
      where: { clientId },
      orderBy: { scheduledAt: 'asc' },
    });

    res.json(events);
  }
);

/**
 * POST /api/clients/:id/events
 * Создать событие для клиента.
 * body: { title, scheduledAt, type, channel?, description? }
 */
eventsRouter.post(
  '/clients/:id/events',
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id: clientId } = req.params;
    const { title, scheduledAt, type, channel, description } = req.body || {};

    if (!title || !scheduledAt || !type) {
      return res.status(400).json({
        error: 'title, scheduledAt and type are required',
      });
    }

    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: {
        id: true,
        userId: true,
      },
    });

    if (!client || !assertClientAccess(req.user, client as any)) {
      return res.status(404).json({ error: 'Client not found' });
    }

    const date = new Date(scheduledAt);
    if (Number.isNaN(date.getTime())) {
      return res.status(400).json({ error: 'Invalid scheduledAt' });
    }

    const event = await prisma.event.create({
      data: {
        clientId,
        title,
        type,
        scheduledAt: date,
        channel: channel ?? null,
        description: description ?? null,
      },
    });

    res.status(201).json(event);
  }
);

/**
 * GET /api/events/upcoming
 * Ближайшие события для dashboard (по умолчанию следующие 7 дней).
 */
eventsRouter.get(
  '/events/upcoming',
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const now = new Date();
    const in7days = new Date();
    in7days.setDate(now.getDate() + 7);

    // Выбираем события только по клиентам, доступным текущему пользователю/tenant.
    // Общие события без clientId также разрешены.
    const user = req.user;

    // Сначала находим всех видимых клиентов (id-only) по тем же правилам, что и /clients.
    const clientWhere: any = {};

    if ((user.role === 'OWNER' || user.role === 'ADMIN') && user.tenantId) {
      clientWhere.tenantId = user.tenantId;
    } else {
      clientWhere.userId = user.id;
    }

    const visibleClients = await prisma.client.findMany({
      where: clientWhere,
      select: { id: true },
    });

    const visibleClientIds = visibleClients.map((c) => c.id);

    const events = await prisma.event.findMany({
      where: {
        scheduledAt: {
          gte: now,
          lte: in7days,
        },
        OR: [
          // События без привязки к клиенту (общие)
          { clientId: null },
          // События по клиентам внутри области видимости пользователя
          ...(visibleClientIds.length
            ? [{ clientId: { in: visibleClientIds } }]
            : []),
        ],
      },
      orderBy: { scheduledAt: 'asc' },
      take: 50,
    });

    res.json(events);
  }
);

export default eventsRouter;