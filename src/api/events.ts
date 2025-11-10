import { http } from './http';

export type EventDto = {
  id: string;
  clientId?: string | null;
  title: string;
  description?: string | null;
  type: string;
  scheduledAt: string;
  channel?: string | null;
};

/**
 * GET /api/clients/:id/events
 * Список событий по клиенту.
 */
export async function fetchClientEvents(
  clientId: string
): Promise<EventDto[]> {
  return http<EventDto[]>({
    url: `/clients/${clientId}/events`,
    method: 'GET',
  });
}

/**
 * POST /api/clients/:id/events
 * Создать событие для клиента.
 */
export async function createClientEvent(
  clientId: string,
  payload: {
    title: string;
    scheduledAt: string;
    type: string;
    channel?: string;
    description?: string;
  }
): Promise<EventDto> {
  return http<EventDto>({
    url: `/clients/${clientId}/events`,
    method: 'POST',
    data: payload,
  });
}

/**
 * GET /api/events/upcoming
 * Ближайшие события для Dashboard.
 */
export async function fetchUpcomingEvents(): Promise<EventDto[]> {
  return http<EventDto[]>({
    url: '/events/upcoming',
    method: 'GET',
  });
}