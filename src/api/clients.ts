import { http } from './http';
import {
  demoFetchClients,
  demoFetchClientProfile,
  demoUpdateClientNorms,
  shouldUseDemoFallback,
} from './demoMode';

export type ClientFlag = 'ok' | 'proteinLow' | 'fiberLow' | 'overKcal';

export type ClientSummary = {
  id: string;
  name: string;
  goal: string | null;
  status: 'active' | 'paused';
  proteinCoverage: number;
  fiberCoverage: number;
  kcalCoverage: number;
  riskFlags: ClientFlag[];
};

export type ClientProfile = {
  id: string;
  name: string;
  status: 'active' | 'paused';
  goal: string | null;
  norms: {
    kcalMin?: number | null;
    kcalMax?: number | null;
    proteinGrams?: number | null;
    fatGramsMin?: number | null;
    fatGramsMax?: number | null;
    carbsGramsMin?: number | null;
    carbsGramsMax?: number | null;
    fiberGrams?: number | null;
  } | null;
  dayStats: {
    id: string;
    date: string;
    kcal?: number | null;
    protein?: number | null;
    fat?: number | null;
    carbs?: number | null;
    fiber?: number | null;
    kcalCoverage?: number | null;
    proteinCoverage?: number | null;
    fiberCoverage?: number | null;
    riskFlags: string[];
  } | null;
  labs: {
    id: string;
    takenAt: string;
    type: string;
    marker: string;
    value: number;
    unit: string;
    status: 'LOW' | 'NORMAL' | 'HIGH';
  }[];
  activeMenu: {
    id: string;
    startDate: string;
    endDate: string | null;
    isActive: boolean;
    menuTemplate: {
      id: string;
      name: string;
      description: string | null;
      focus: string | null;
    };
  } | null;
  events: {
    id: string;
    title: string;
    description: string | null;
    type: string;
    scheduledAt: string;
    channel: string | null;
  }[];
};

export async function fetchClients(): Promise<ClientSummary[]> {
  try {
    return await http<ClientSummary[]>({
      url: '/clients',
      method: 'GET',
    });
  } catch (err) {
    if (shouldUseDemoFallback(err)) {
      return demoFetchClients();
    }
    throw err;
  }
}

export async function fetchClientProfile(id: string): Promise<ClientProfile> {
  try {
    return await http<ClientProfile>({
      url: `/clients/${id}/profile`,
      method: 'GET',
    });
  } catch (err) {
    if (shouldUseDemoFallback(err)) {
      return demoFetchClientProfile(id);
    }
    throw err;
  }
}

export type ClientNormsPayload = {
  kcalMin?: number;
  kcalMax?: number;
  proteinGrams?: number;
  fatGramsMin?: number;
  fatGramsMax?: number;
  carbsGramsMin?: number;
  carbsGramsMax?: number;
  fiberGrams?: number;
};

/**
 * PUT /clients/:id/norms
 * Обновляет нормы клиента и возвращает актуальный профиль.
 */
export async function updateClientNorms(
  clientId: string,
  payload: ClientNormsPayload
): Promise<ClientProfile> {
  try {
    return await http<ClientProfile>({
      url: `/clients/${clientId}/norms`,
      method: 'PUT',
      data: payload,
    });
  } catch (err) {
    if (shouldUseDemoFallback(err)) {
      return demoUpdateClientNorms(clientId, payload);
    }
    throw err;
  }
}
