import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ClientList } from './ClientList';

jest.mock('../../api/clients', () => ({
  __esModule: true,
  fetchClients: jest.fn(),
}));

import * as clientsApi from '../../api/clients';

const clientsMock: clientsApi.ClientSummary[] = [
  {
    id: 'c1',
    name: 'Active Ok',
    goal: 'Keep fit',
    status: 'active',
    proteinCoverage: 1,
    fiberCoverage: 1,
    kcalCoverage: 1,
    riskFlags: ['ok'],
  },
  {
    id: 'c2',
    name: 'Active Risk',
    goal: 'Lose weight',
    status: 'active',
    proteinCoverage: 0.7,
    fiberCoverage: 0.7,
    kcalCoverage: 1.1,
    riskFlags: ['proteinLow', 'fiberLow'],
  },
  {
    id: 'c3',
    name: 'Paused',
    goal: null,
    status: 'paused',
    proteinCoverage: 1,
    fiberCoverage: 1,
    kcalCoverage: 1,
    riskFlags: ['ok'],
  },
];

describe('ClientList', () => {
  const mockedFetchClients = clientsApi.fetchClients as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('отображает список клиентов после загрузки', async () => {
    mockedFetchClients.mockResolvedValueOnce(clientsMock);

    render(<ClientList onSelectClient={() => {}} />);

    expect(screen.getByText('Загрузка...')).toBeInTheDocument();

    const item = await screen.findByText('Active Ok');
    expect(item).toBeInTheDocument();
    expect(screen.getByText('Active Risk')).toBeInTheDocument();
    expect(screen.getByText('Paused')).toBeInTheDocument();
  });

  it('фильтрует по "Активные" и "Требуют внимания"', async () => {
    mockedFetchClients.mockResolvedValueOnce(clientsMock);

    render(<ClientList onSelectClient={() => {}} />);

    await screen.findByText('Active Ok');

    fireEvent.click(screen.getByText('Активные'));
    expect(screen.getByText('Active Ok')).toBeInTheDocument();
    expect(screen.getByText('Active Risk')).toBeInTheDocument();
    expect(screen.queryByText('Paused')).toBeNull();

    fireEvent.click(screen.getByText('Требуют внимания'));
    expect(screen.getByText('Active Risk')).toBeInTheDocument();
    expect(screen.queryByText('Active Ok')).toBeNull();
    expect(screen.queryByText('Paused')).toBeNull();
  });

  it('показывает сообщение об ошибке при неуспешной загрузке', async () => {
    mockedFetchClients.mockRejectedValueOnce(new Error('Network'));

    render(<ClientList onSelectClient={() => {}} />);

    const error = await screen.findByText(
      'Не удалось загрузить список клиентов'
    );
    expect(error).toBeInTheDocument();
  });
});