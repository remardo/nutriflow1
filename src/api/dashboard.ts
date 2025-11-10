import { http } from './http';

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
  return http<DashboardSummary>({
    url: '/dashboard/summary',
    method: 'GET',
  });
}