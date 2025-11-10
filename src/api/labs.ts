import { http } from './http';

export type LabStatus = 'LOW' | 'NORMAL' | 'HIGH';

export type LabTestDto = {
  id: string;
  takenAt: string;
  type: string;
  marker: string;
  value: number;
  unit: string;
  status: LabStatus;
};

export type CreateLabBatchItem = {
  markerCode: string;
  value: number;
  unit?: string;
  takenAt?: string; // ISO-строка
  type?: string;
};

export type LabMarkerDto = {
  marker: string;
  name?: string;
  unit?: string;
};

export type LabSeriesPointDto = {
  takenAt: string;
  value: number;
  status: LabStatus;
};

export type LabSummaryItemDto = {
  marker: string;
  name?: string;
  lastValue: number;
  unit: string;
  status: LabStatus;
  lastTakenAt: string;
  trend: 'up' | 'down' | 'stable';
  delta?: number;
};

/**
 * GET /api/clients/:id/labs
 */
export async function getClientLabs(
  clientId: string,
  params?: { limit?: number; offset?: number }
): Promise<LabTestDto[]> {
  const search = new URLSearchParams();
  if (params?.limit != null) search.set('limit', String(params.limit));
  if (params?.offset != null) search.set('offset', String(params.offset));

  const qs = search.toString();
  const url =
    qs.length > 0
      ? `/clients/${clientId}/labs?${qs}`
      : `/clients/${clientId}/labs`;

  return http<LabTestDto[]>({
    url,
    method: 'GET',
  });
}

/**
 * POST /api/clients/:id/labs/batch
 */
export async function createClientLabsBatch(
  clientId: string,
  items: CreateLabBatchItem[]
): Promise<LabTestDto[]> {
  return http<LabTestDto[]>({
    url: `/clients/${clientId}/labs/batch`,
    method: 'POST',
    data: { items },
  });
}

/**
 * GET /api/clients/:id/labs/markers
 */
export async function getClientLabMarkers(
  clientId: string
): Promise<LabMarkerDto[]> {
  const res = await http<{ markers: LabMarkerDto[] }>({
    url: `/clients/${clientId}/labs/markers`,
    method: 'GET',
  });
  return res.markers;
}

/**
 * GET /api/clients/:id/labs/series?marker=CODE
 */
export async function getClientLabSeries(
  clientId: string,
  markerCode: string
): Promise<LabSeriesPointDto[]> {
  const code = markerCode.trim().toUpperCase();
  return http<LabSeriesPointDto[]>({
    url: `/clients/${clientId}/labs/series?marker=${encodeURIComponent(code)}`,
    method: 'GET',
  });
}

/**
 * GET /api/clients/:id/labs/summary
 */
export async function getClientLabSummary(
  clientId: string
): Promise<LabSummaryItemDto[]> {
  const res = await http<{ markers: LabSummaryItemDto[] }>({
    url: `/clients/${clientId}/labs/summary`,
    method: 'GET',
  });
  return res.markers;
}