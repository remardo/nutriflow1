import { http } from './http';
import type { ClientProfile } from './clients';
import {
  demoAssignMenu,
  demoFetchClientMenu,
  demoFetchMenuTemplates,
  shouldUseDemoFallback,
} from './demoMode';

export type MenuTemplateDto = {
  id: string;
  name: string;
  description: string | null;
  focus: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ClientMenuAssignmentDto = {
  id: string;
  clientId: string;
  menuTemplateId: string;
  startDate: string;
  endDate: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  menuTemplate: MenuTemplateDto;
};

export type ClientMenuResponse = {
  active: ClientMenuAssignmentDto[];
  archived: ClientMenuAssignmentDto[];
};

/**
 * GET /api/menu-templates
 */
export async function fetchMenuTemplates(): Promise<MenuTemplateDto[]> {
  try {
    return await http<MenuTemplateDto[]>({
      url: '/menu-templates',
      method: 'GET',
    });
  } catch (err) {
    if (shouldUseDemoFallback(err)) {
      return demoFetchMenuTemplates();
    }
    throw err;
  }
}

/**
 * GET /api/clients/:id/menu
 */
export async function fetchClientMenu(
  clientId: string
): Promise<ClientMenuResponse> {
  try {
    return await http<ClientMenuResponse>({
      url: `/clients/${clientId}/menu`,
      method: 'GET',
    });
  } catch (err) {
    if (shouldUseDemoFallback(err)) {
      return demoFetchClientMenu(clientId);
    }
    throw err;
  }
}

/**
 * POST /api/clients/:id/menu-assignment
 * Возвращает обновлённый ClientProfile для удобства.
 */
export async function assignMenu(
  clientId: string,
  menuTemplateId: string,
  startDate?: string,
  endDate?: string
): Promise<ClientProfile> {
  const body: any = { menuTemplateId };
  if (startDate) body.startDate = startDate;
  if (endDate) body.endDate = endDate;

  try {
    return await http<ClientProfile>({
      url: `/clients/${clientId}/menu-assignment`,
      method: 'POST',
      data: body,
    });
  } catch (err) {
    if (shouldUseDemoFallback(err)) {
      return demoAssignMenu(clientId, menuTemplateId, startDate, endDate);
    }
    throw err;
  }
}
