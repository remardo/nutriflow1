import { Router, Response } from 'express';
import { LabStatus, PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '../middleware/auth';
import { assertClientAccess } from '../utils/access';
import { prisma } from '../prisma';
import {
  mapMarkerCode,
  evaluateLabStatus,
  calculateTrend,
} from '../services/labAnalysis';

type PrismaWithLabMarkerRef = PrismaClient & {
  labMarkerRef: {
    findMany: (args: any) => Promise<any[]>;
  };
};

export const labsRouter = Router();

/**
 * Хелпер проверки доступа к клиенту.
 * При отсутствии доступа возвращает 404.
 */
async function getAccessibleClientOr404(
  req: AuthenticatedRequest,
  res: Response,
  clientId: string
) {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return null;
  }

  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: {
      id: true,
      userId: true,
    },
  });

  if (!client || !assertClientAccess(req.user, client as any)) {
    res.status(404).json({ error: 'Client not found' });
    return null;
  }

  return client;
}

/**
 * GET /api/clients/:id/labs
 * Список лабораторных анализов клиента с пагинацией.
 */
labsRouter.get(
  '/clients/:id/labs',
  async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    const client = await getAccessibleClientOr404(req, res, id);
    if (!client) return;

    const limit = Math.min(
      100,
      parseInt((req.query.limit as string) || '50', 10) || 50
    );
    const offset = parseInt((req.query.offset as string) || '0', 10) || 0;

    const labs = await prisma.labTest.findMany({
      where: { clientId: id },
      orderBy: { takenAt: 'desc' },
      take: limit,
      skip: offset,
    });

    res.json(
      labs.map((l) => ({
        id: l.id,
        takenAt: l.takenAt,
        type: l.type,
        marker: l.marker,
        value: l.value,
        unit: l.unit,
        status: l.status,
      }))
    );
  }
);

/**
 * POST /api/clients/:id/labs/batch
 * Пакетное добавление лабораторных анализов.
 */
labsRouter.post(
  '/clients/:id/labs/batch',
  async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    const client = await getAccessibleClientOr404(req, res, id);
    if (!client) return;

    const body = req.body as {
      items: {
        markerCode: string;
        value: number;
        unit?: string;
        takenAt?: string;
        type?: string;
      }[];
    };

    if (!body || !Array.isArray(body.items) || body.items.length === 0) {
      return res.status(400).json({ error: 'Invalid payload: items required' });
    }

    try {
      const created = await prisma.$transaction(async (tx) => {
        const markerCodes = Array.from(
          new Set(
            body.items
              .map((i) => mapMarkerCode(i.markerCode))
              .filter((c) => !!c)
          )
        );

        const refs =
          markerCodes.length > 0
            ? await (prisma as PrismaWithLabMarkerRef).labMarkerRef.findMany({
                where: { code: { in: markerCodes } },
              })
            : [];

        const refByCode = new Map<string, (typeof refs)[number]>();
        refs.forEach((r: any) => refByCode.set(r.code, r));

        const toCreate = body.items.map((item) => {
          const markerCode = mapMarkerCode(item.markerCode);
          if (!markerCode) {
            throw new Error('markerCode is required');
          }
          if (typeof item.value !== 'number' || Number.isNaN(item.value)) {
            throw new Error(
              `Invalid value for marker ${markerCode}: must be number`
            );
          }

          const ref = refByCode.get(markerCode);
          const status: LabStatus = evaluateLabStatus({
            markerCode,
            value: item.value,
            ref: ref
              ? { low: ref.low ?? undefined, high: ref.high ?? undefined }
              : undefined,
          });

          const unit =
            item.unit || ref?.unit || ''; // если нет — пустая строка, фронт может отобразить как "—"
          const type = item.type || 'LAB';

          const takenAt = item.takenAt
            ? new Date(item.takenAt)
            : new Date();

          if (Number.isNaN(takenAt.getTime())) {
            throw new Error(
              `Invalid takenAt for marker ${markerCode}: must be ISO date`
            );
          }

          return {
            clientId: id,
            marker: markerCode,
            value: item.value,
            unit,
            type,
            takenAt,
            status,
          };
        });

        const createdRows = await Promise.all(
          toCreate.map((data) => tx.labTest.create({ data }))
        );

        return createdRows;
      });

      res.status(201).json(
        created.map((l) => ({
          id: l.id,
          takenAt: l.takenAt,
          type: l.type,
          marker: l.marker,
          value: l.value,
          unit: l.unit,
          status: l.status,
        }))
      );
    } catch (e: any) {
      return res.status(400).json({
        error: 'Failed to create lab tests batch',
        details: e?.message,
      });
    }
  }
);

/**
 * GET /api/clients/:id/labs/markers
 * Список уникальных маркеров клиента и, если есть, их названия из LabMarkerRef.
 */
labsRouter.get(
  '/clients/:id/labs/markers',
  async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    const client = await getAccessibleClientOr404(req, res, id);
    if (!client) return;

    const rows = await prisma.labTest.findMany({
      where: { clientId: id },
      select: { marker: true },
      distinct: ['marker'],
      orderBy: { marker: 'asc' },
    });

    const codes = rows.map((r) => r.marker);
    if (codes.length === 0) {
      return res.json({ markers: [] });
    }

    const refs = await (prisma as PrismaWithLabMarkerRef).labMarkerRef.findMany({
      where: { code: { in: codes } },
    });
    const refByCode = new Map<string, (typeof refs)[number]>();
    refs.forEach((r: any) => refByCode.set(r.code, r));

    const markers = codes.map((code) => {
      const ref = refByCode.get(code);
      return {
        marker: code,
        name: ref?.name,
        unit: ref?.unit,
      };
    });

    res.json({ markers });
  }
);

/**
 * GET /api/clients/:id/labs/series?marker=CODE
 * Временной ряд по конкретному маркеру.
 */
labsRouter.get(
  '/clients/:id/labs/series',
  async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const markerParam = (req.query.marker as string) || '';

    const client = await getAccessibleClientOr404(req, res, id);
    if (!client) return;

    const markerCode = mapMarkerCode(markerParam);
    if (!markerCode) {
      return res
        .status(400)
        .json({ error: 'Query parameter "marker" is required' });
    }

    const series = await prisma.labTest.findMany({
      where: { clientId: id, marker: markerCode },
      orderBy: { takenAt: 'asc' },
    });

    res.json(
      series.map((l) => ({
        takenAt: l.takenAt,
        value: l.value,
        status: l.status,
      }))
    );
  }
);

/**
 * GET /api/clients/:id/labs/summary
 * Сводка по последним значениям маркеров, трендам и дельтам.
 */
labsRouter.get(
  '/clients/:id/labs/summary',
  async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    const client = await getAccessibleClientOr404(req, res, id);
    if (!client) return;

    const labs = await prisma.labTest.findMany({
      where: { clientId: id },
      orderBy: { takenAt: 'asc' },
    });

    if (labs.length === 0) {
      return res.json({ markers: [] });
    }

    const refs = await (prisma as PrismaWithLabMarkerRef).labMarkerRef.findMany({
      where: { code: { in: Array.from(new Set(labs.map((l) => l.marker))) } },
    });
    const refByCode = new Map<string, (typeof refs)[number]>();
    refs.forEach((r: any) => refByCode.set(r.code, r));

    const byMarker = new Map<
      string,
      { takenAt: Date; value: number; unit: string; status: LabStatus }[]
    >();

    for (const l of labs) {
      const arr = byMarker.get(l.marker) || [];
      arr.push({
        takenAt: l.takenAt,
        value: l.value,
        unit: l.unit,
        status: l.status,
      });
      byMarker.set(l.marker, arr);
    }

    const markersSummary = Array.from(byMarker.entries()).map(
      ([marker, entries]) => {
        const sorted = entries.sort(
          (a, b) => a.takenAt.getTime() - b.takenAt.getTime()
        );
        const last = sorted[sorted.length - 1];
        const prev = sorted.length > 1 ? sorted[sorted.length - 2] : null;

        const trend = calculateTrend(
          sorted.map((e) => ({
            takenAt: e.takenAt,
            value: e.value,
          }))
        );

        const delta =
          prev != null ? Number((last.value - prev.value).toFixed(2)) : undefined;

        const ref = refByCode.get(marker);

        return {
          marker,
          name: ref?.name,
          lastValue: last.value,
          unit: last.unit || ref?.unit || '',
          status: last.status,
          lastTakenAt: last.takenAt.toISOString(),
          trend,
          delta,
        };
      }
    );

    res.json({ markers: markersSummary });
  }
);