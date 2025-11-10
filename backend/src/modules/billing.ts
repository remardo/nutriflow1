import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '../middleware/auth';

const prisma = new PrismaClient();
export const billingRouter = Router();

/**
 * GET /api/billing/plan
 *
 * RBAC/tenant:
 * - requireAuth на уровне app.ts.
 * - Возвращает план в контексте текущего tenant, если такая логика есть,
 *   либо глобальный demo/Pro план.
 * - Не раскрывает данные других tenants.
 */
billingRouter.get(
  '/billing/plan',
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      // Если в модели BillingPlan есть tenantId, можно отфильтровать:
      // const where: any = {};
      // if (req.user.tenantId) where.tenantId = req.user.tenantId;
      // В текущем примере оставляем глобальный lookup без утечки специфичных данных.

      const proPlan = await prisma.billingPlan.findFirst({
        where: { name: 'Pro' },
        orderBy: { createdAt: 'asc' },
      });

      if (proPlan) {
        return res.json(proPlan);
      }

      const anyPlan = await prisma.billingPlan.findFirst({
        orderBy: { createdAt: 'asc' },
      });

      if (anyPlan) {
        return res.json(anyPlan);
      }

      // fallback, если в БД нет записей
      return res.json({
        id: 'demo-plan',
        name: 'Demo Plan',
        maxClients: 20,
        features: ['clients', 'labs', 'menu', 'events', 'basic-dashboard'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Failed to load billing plan', err);
      res.status(500).json({ error: 'Failed to load billing plan' });
    }
  }
);

export default billingRouter;