
import React from 'react';
import './LabTests.css';
import { Card } from '../../components/Card/Card';
import { Tag } from '../../components/Tag/Tag';

type LabRow = {
  id: string;
  client: string;
  type: string;
  value: string;
  date: string;
  status: 'low' | 'ok' | 'high';
};

const rows: LabRow[] = [
  {
    id: 'l1',
    client: 'Анна Петрова',
    type: 'Ферритин',
    value: '18 нг/мл',
    date: '10.08',
    status: 'low',
  },
  {
    id: 'l2',
    client: 'Игорь Смирнов',
    type: 'Витамин D',
    value: '32 нг/мл',
    date: '09.08',
    status: 'ok',
  },
  {
    id: 'l3',
    client: 'Анна Петрова',
    type: 'ОАК',
    value: 'OK',
    date: '05.08',
    status: 'ok',
  },
];

export const LabTests: React.FC = () => {
  const [filterClient, setFilterClient] = React.useState('all');

  const filtered = rows.filter(
    (r) => filterClient === 'all' || r.client === filterClient
  );

  return (
    <div className="LabTestsRoot">
      <Card
        title="Лабораторные анализы"
        subtitle="LabTestType + LabTestResult: централизованный контроль"
      >
        <div className="LabTests-filters">
          <select
            className="LabTests-select"
            value={filterClient}
            onChange={(e) => setFilterClient(e.target.value)}
          >
            <option value="all">Все клиенты</option>
            <option value="Анна Петрова">Анна Петрова</option>
            <option value="Игорь Смирнов">Игорь Смирнов</option>
          </select>
          <button className="LabTests-btn">+ Добавить результат</button>
        </div>
        <div className="LabTests-table">
          <div className="LabTests-header">
            <div>Клиент</div>
            <div>Показатель</div>
            <div>Значение</div>
            <div>Дата</div>
            <div>Статус</div>
          </div>
          {filtered.map((r) => (
            <div key={r.id} className="LabTests-row">
              <div>{r.client}</div>
              <div>{r.type}</div>
              <div>{r.value}</div>
              <div>{r.date}</div>
              <div>
                {r.status === 'ok' && (
                  <Tag label="в норме" color="green" subtle />
                )}
                {r.status === 'low' && (
                  <Tag label="ниже нормы" color="orange" />
                )}
                {r.status === 'high' && (
                  <Tag label="выше нормы" color="red" />
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="LabTests-note">
          В реальной системе: типы анализов и референсы хранятся в LabTestType,
          история клиента доступна в разрезе каждого показателя.
        </div>
      </Card>
    </div>
  );
};
