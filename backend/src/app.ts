import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';

import { clientsRouter } from './modules/clients';
import { dashboardRouter } from './modules/dashboard';
import { labsRouter } from './modules/labs';
import { menuRouter } from './modules/menu';
import { eventsRouter } from './modules/events';
import { billingRouter } from './modules/billing';
import { authRouter } from './modules/auth';
import { requireAuth } from './middleware/auth';
import { httpLogger, logger, createRequestId } from './logger';

const app = express();

// Basic middleware
app.use(cors());
app.use(helmet());
app.use(express.json());

// Request-id middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const headerRequestId = req.header('X-Request-Id');
  const requestId = headerRequestId || createRequestId();

  // Сохраняем в req (типизировано через declaration merging) и пробрасываем в ответ
  (req as any).requestId = requestId;
  res.setHeader('X-Request-Id', requestId);

  next();
});

// HTTP structured logger (pino-http)
app.use(httpLogger);

    // Healthcheck (liveness)
    app.get('/health', (_req: Request, res: Response) => {
      res.json({
        status: 'ok',
        service: 'nutriflow-backend',
        time: new Date().toISOString(),
      });
    });
   
    // Readiness check (DB connectivity)
    app.get('/ready', async (_req: Request, res: Response) => {
      try {
        // Лёгкая проверка доступности БД
        const { prisma } = await import('./prisma');
        await prisma.$queryRawUnsafe('SELECT 1');
        res.status(200).json({ status: 'ready' });
      } catch (error) {
        logger.error(
          { err: error, msg: 'Readiness check failed' },
          'Readiness check failed'
        );
        res
          .status(503)
          .json({ status: 'unhealthy', error: 'db_unreachable' });
      }
    });

// API root
app.get('/api', (_req: Request, res: Response) => {
  res.json({
    name: 'NutriFlow API',
    version: '0.1.0',
    endpoints: {
      clients: '/api/clients',
      clientProfile: '/api/clients/:id/profile',
      dashboardSummary: '/api/dashboard/summary',
      clientLabs: '/api/clients/:id/labs',
    },
  });
});

app.use('/api', authRouter);

// Protected routes
app.use('/api/clients', requireAuth, clientsRouter);
app.use('/api/dashboard', requireAuth, dashboardRouter);
app.use('/api', requireAuth, labsRouter);
app.use('/api', requireAuth, menuRouter);
app.use('/api', requireAuth, eventsRouter);
app.use('/api', requireAuth, billingRouter);

// Global error handler
app.use(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  (err: any, req: Request, res: Response, _next: NextFunction) => {
    const requestId = (req as any).requestId as string | undefined;

    logger.error(
      {
        msg: 'Unhandled error',
        err,
        requestId,
      },
      'Unhandled error'
    );

    res.status(500).json({ error: 'Internal Server Error', requestId });
  }
);

const PORT = process.env.PORT || 4000;

if (require.main === module) {
  app.listen(PORT, () => {
    logger.info({ port: PORT }, 'NutriFlow backend listening');
  });
}

export default app;