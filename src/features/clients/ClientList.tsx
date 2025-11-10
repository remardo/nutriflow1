
import React from 'react';
import './ClientList.css';
import { Card } from '../../components/Card/Card';
import { Tag } from '../../components/Tag/Tag';
import { fetchClients, ClientSummary } from '../../api/clients';

type ClientListProps = {
  onSelectClient: (clientId: string) => void;
};

export const ClientList: React.FC<ClientListProps> = ({ onSelectClient }) => {
  const [filter, setFilter] = React.useState<'all' | 'active' | 'risk'>('all');
  const [clients, setClients] = React.useState<ClientSummary[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await fetchClients();
        if (mounted) {
          setClients(data);
          setError(null);
        }
      } catch (e) {
        if (mounted) {
          setError('Не удалось загрузить список клиентов');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const filtered = clients.filter((c) => {
    if (filter === 'active') return c.status === 'active';
    if (filter === 'risk') return c.riskFlags.some((f) => f !== 'ok');
    return true;
  });

  return (
    <div className="ClientListRoot">
      <Card
        title="Клиенты"
        subtitle="Управление клиентами, статус, цели и риски по нутриентам"
      >
        {loading && <div className="ClientList-status">Загрузка...</div>}
        {error && <div className="ClientList-status ClientList-status--error">{error}</div>}
        <div className="ClientList-filters">
          <button
            className={`ClientList-filter ${filter === 'all' ? 'is-active' : ''}`}
            onClick={() => setFilter('all')}
          >
            Все
          </button>
          <button
            className={`ClientList-filter ${filter === 'active' ? 'is-active' : ''}`}
            onClick={() => setFilter('active')}
          >
            Активные
          </button>
          <button
            className={`ClientList-filter ${filter === 'risk' ? 'is-active' : ''}`}
            onClick={() => setFilter('risk')}
          >
            Требуют внимания
          </button>
        </div>
        <div className="ClientList-table">
          <div className="ClientList-header">
            <div>Клиент</div>
            <div>Цель</div>
            <div>КБЖУ / нутриенты</div>
            <div>Статус</div>
          </div>
          {filtered.map((c) => (
            <button
              key={c.id}
              className="ClientList-row"
              onClick={() => onSelectClient(c.id)}
            >
              <div className="ClientList-cell name">{c.name}</div>
              <div className="ClientList-cell">{c.goal}</div>
              <div className="ClientList-cell">
                <span className="ClientList-pill">
                  Б: {Math.round(c.proteinCoverage * 100)}%
                </span>
                <span className="ClientList-pill">
                  Клетч: {Math.round(c.fiberCoverage * 100)}%
                </span>
                <span className="ClientList-pill">
                  Ккал: {Math.round(c.kcalCoverage * 100)}%
                </span>
              </div>
              <div className="ClientList-cell">
                {c.riskFlags.includes('proteinLow') && (
                  <Tag label="Низкий белок" color="orange" subtle />
                )}
                {c.riskFlags.includes('fiberLow') && (
                  <Tag label="Низкая клетчатка" color="orange" subtle />
                )}
                {c.riskFlags.includes('ok') && (
                  <Tag label="В норме" color="green" subtle />
                )}
              </div>
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
};
