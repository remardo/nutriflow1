import { http } from './http';

const API_PREFIX = '/billing';

export type BillingPlanDto = {
  id: string;
  name: string;
  maxClients: number;
  features: string[];
  createdAt: string;
  updatedAt: string;
};

/**
 * GET /api/billing/plan
 * Получить активный тарифный план.
 */
export async function fetchBillingPlan(): Promise<BillingPlanDto> {
  return http<BillingPlanDto>({
    url: `${API_PREFIX}/plan`,
    method: 'GET',
  });
}