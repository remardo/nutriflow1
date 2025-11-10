import React from 'react';
import { render, screen } from '@testing-library/react';
import { Dashboard } from './Dashboard';
import * as dashboardApi from '../../api/dashboard';

jest.mock('../../api/dashboard', () => ({
  fetchDashboardSummary: jest.fn(),
}));

describe('Dashboard', () => {
  const summaryMock: dashboardApi.DashboardSummary = {
    totalClients: 10,
    activeClients: 7,
    risks: {
      ok: 60,
      proteinLow: 20,
      fiberLow: 10,
      overKcal: 10,
    },
    eventsUpcomingCount: 2,
    events: [
      {
        id: 'e1',
        clientId: 'c1',
        title: 'Check-in',
        scheduledAt: new Date().toISOString(),
        channel: 'telegram',
        type: 'call',
      },
    ],
    menu: {
      clientsWithActiveMenu: 5,
    },
    labs: {
      lowRiskClients: 3,
    },
  };

  const mockedFetch = dashboardApi.fetchDashboardSummary as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('отрисовывает основные блоки дэшборда при успешной загрузке', async () => {
    mockedFetch.mockResolvedValueOnce(summaryMock);

    render(<Dashboard onSelectClient={() => {}} />);

    const overviewTitle = await screen.findByText('Обзор клиентов');
    expect(overviewTitle).toBeInTheDocument();

    expect(screen.getByText('Недобор белка')).toBeInTheDocument();
    expect(screen.getByText('Недобор клетчатки')).toBeInTheDocument();
    expect(
      screen.getByText('Клиенты с активным меню')
    ).toBeInTheDocument();

    expect(
      screen.getByText('События и контрольные точки')
    ).toBeInTheDocument();
    expect(
      screen.getByText(/событий в ближайшие 7 дней/i)
    ).toBeInTheDocument();
  });

  it('показывает сообщение об ошибке при неуспешной загрузке', async () => {
    mockedFetch.mockRejectedValueOnce(new Error('Network error'));

    render(<Dashboard onSelectClient={() => {}} />);

    const error = await screen.findByText(
      'Не удалось загрузить сводку по системе'
    );
    expect(error).toBeInTheDocument();
  });
});