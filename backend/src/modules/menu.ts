import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '../middleware/auth';
import { assertClientAccess } from '../utils/access';

const prisma = new PrismaClient();
export const menuRouter = Router();

/**
 * GET /api/menu-templates
 * Список доступных шаблонов меню.
 */
menuRouter.get('/menu-templates', async (_req: Request, res: Response) => {
  const templates = await prisma.menuTemplate.findMany({
    orderBy: { createdAt: 'desc' },
  });
  res.json(templates);
});

/**
 * GET /api/clients/:id/menu
 * Активные и архивные назначения меню клиента.
 */
menuRouter.get(
  '/clients/:id/menu',
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

    const assignments = await prisma.menuAssignment.findMany({
      where: { clientId },
      include: { menuTemplate: true },
      orderBy: { startDate: 'desc' },
    });

    const active = assignments.filter((a) => a.isActive);
    const archived = assignments.filter((a) => !a.isActive);

    res.json({ active, archived });
  }
);

/**
 * POST /api/clients/:id/menu-assignment
 * Создать активное назначение меню.
 * body: { menuTemplateId, startDate?, endDate? }
 */
menuRouter.post(
  '/clients/:id/menu-assignment',
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id: clientId } = req.params;
    const { menuTemplateId, startDate, endDate } = req.body || {};

    if (!menuTemplateId) {
      return res
        .status(400)
        .json({ error: 'menuTemplateId is required' });
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

    const template = await prisma.menuTemplate.findUnique({
      where: { id: menuTemplateId },
      select: { id: true },
    });
    if (!template) {
      return res.status(404).json({ error: 'MenuTemplate not found' });
    }

    let parsedStart: Date | undefined;
    let parsedEnd: Date | undefined;

    if (startDate) {
      const d = new Date(startDate);
      if (Number.isNaN(d.getTime())) {
        return res
          .status(400)
          .json({ error: 'Invalid startDate' });
      }
      parsedStart = d;
    }

    if (endDate) {
      const d = new Date(endDate);
      if (Number.isNaN(d.getTime())) {
        return res
          .status(400)
          .json({ error: 'Invalid endDate' });
      }
      parsedEnd = d;
    }

    // Деактивируем предыдущие активные назначения для клиента
    await prisma.menuAssignment.updateMany({
      where: { clientId, isActive: true },
      data: { isActive: false },
    });

    const assignment = await prisma.menuAssignment.create({
      data: {
        clientId,
        menuTemplateId,
        startDate: parsedStart ?? new Date(),
        endDate: parsedEnd,
        isActive: true,
      },
      include: { menuTemplate: true },
    });

    // Возвращаем обновлённый профиль клиента для синхронизации фронта
    const updatedProfile = await prisma.client.findUnique({
      where: { id: clientId },
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

    if (!updatedProfile) {
      return res
        .status(500)
        .json({ error: 'Failed to load updated client profile' });
    }

    const latestStats = updatedProfile.dayStats[0];

    res.status(201).json({
      id: updatedProfile.id,
      name: updatedProfile.fullName,
      status:
        updatedProfile.status === 'ACTIVE'
          ? 'active'
          : 'paused',
      goal: updatedProfile.goal,
      norms: updatedProfile.norms ?? null,
      dayStats: latestStats ?? null,
      labs: updatedProfile.labTests,
      activeMenu: updatedProfile.menuAssignments[0] ?? null,
      events: updatedProfile.events,
    });
  }
);

export default menuRouter;