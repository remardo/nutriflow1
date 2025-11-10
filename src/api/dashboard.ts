import { http } from './http';
import { demoFetchDashboardSummary, shouldUseDemoFallback } from './demoMode';

export type DashboardSummaryEvent = {
  id: string;
  clientId: string | null;
  title: string;
  scheduledAt: string;
  channel: string | null;
  type: string;
};

export type DashboardSummary = {
  totalClients: number;
  activeClients: number;
  risks: {
    ok: number;
    proteinLow: number;
    fiberLow: number;
    overKcal: number;
  };
  eventsUpcomingCount: number;
  events: DashboardSummaryEvent[];
  menu: {
    clientsWithActiveMenu: number;
  };
  labs: {
    lowRiskClients: number;
  };
};

export async function fetchDashboardSummary(): Promise<DashboardSummary> {
  try {
    return await http<DashboardSummary>({
      url: '/dashboard/summary',
      method: 'GET',
    });
  } catch (err) {
    if (shouldUseDemoFallback(err)) {
      return demoFetchDashboardSummary();
    }
    throw err;
  }
}
