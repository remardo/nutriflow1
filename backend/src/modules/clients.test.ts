import { ClientStatus } from '@prisma/client';
import { toClientSummary, ClientSummaryDto } from './clients';

describe('toClientSummary helper', () => {
  it('формирует riskFlags и coverage по последнему dayStats', () => {
    const client = {
      id: 'c1',
      fullName: 'Test Client',
      status: ClientStatus.ACTIVE,
      goal: 'fat loss',
      dayStats: [
        {
          proteinCoverage: 0.7,
          fiberCoverage: 0.8,
          kcalCoverage: 1.1,
          riskFlags: ['proteinLow', 'fiberLow', 'overKcal'],
        },
      ],
    };

    const summary: ClientSummaryDto = toClientSummary(client as any);

    expect(summary.id).toBe('c1');
    expect(summary.name).toBe('Test Client');
    expect(summary.status).toBe('active');
    expect(summary.goal).toBe('fat loss');
    expect(summary.proteinCoverage).toBe(0.7);
    expect(summary.fiberCoverage).toBe(0.8);
    expect(summary.kcalCoverage).toBe(1.1);
    expect(summary.riskFlags).toContain('proteinLow');
    expect(summary.riskFlags).toContain('fiberLow');
  });

  it('ставит ok, если рисков по порогам нет или нет dayStats', () => {
    const clientNoStats = {
      id: 'c2',
      fullName: 'No Stats',
      status: ClientStatus.PAUSED,
      goal: null,
      dayStats: [],
    };

    const s1 = toClientSummary(clientNoStats as any);
    expect(s1.status).toBe('paused');
    expect(s1.riskFlags).toEqual(['ok']);
    expect(s1.proteinCoverage).toBe(1);
    expect(s1.fiberCoverage).toBe(1);
    expect(s1.kcalCoverage).toBe(1);

    const clientOk = {
      id: 'c3',
      fullName: 'All Good',
      status: ClientStatus.ACTIVE,
      goal: null,
      dayStats: [
        {
          proteinCoverage: 0.9,
          fiberCoverage: 0.9,
          kcalCoverage: 1.0,
          riskFlags: [],
        },
      ],
    };

    const s2 = toClientSummary(clientOk as any);
    expect(s2.riskFlags).toEqual(['ok']);
  });

  it('корректно мапит status ACTIVE/PAUSED в active/paused', () => {
    const active = {
      id: 'a1',
      fullName: 'Active',
      status: ClientStatus.ACTIVE,
      goal: null,
      dayStats: [],
    };
    const paused = {
      id: 'p1',
      fullName: 'Paused',
      status: ClientStatus.PAUSED,
      goal: null,
      dayStats: [],
    };

    const sa = toClientSummary(active as any);
    const sp = toClientSummary(paused as any);

    expect(sa.status).toBe('active');
    expect(sp.status).toBe('paused');
  });
});