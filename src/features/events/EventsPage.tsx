
import React from 'react';
import './EventsPage.css';
import { Card } from '../../components/Card/Card';
import { Tag } from '../../components/Tag/Tag';

type Event = {
  id: string;
  client: string;
  type: 'call' | 'lab' | 'checkpoint';
  title: string;
  datetime: string;
  channel: string;
  status: 'scheduled' | 'done';
};

const mockEvents: Event[] = [
  {
    id: 'e1',
    client: 'Анна Петрова',
    type: 'lab',
    title: 'Сдать ферритин',
    datetime: '10.08 · 19:30',
    channel: 'Клиника',
    status: 'scheduled',
  },
  {
    id: 'e2',
    client: 'Игорь Смирнов',
    type: 'call',
    title: 'Звонок по прогрессу',
    datetime: '11.08 · 11:00',
    channel: 'Zoom',
    status: 'scheduled',
  },
];

export const EventsPage: React.FC = () => {
  return (
    <div className="EventsPageRoot">
      <Card
        title="События и напоминания"
        subtitle="Events & Scheduling Service + интеграция с Telegram"
      >
        <div className="EventsPage-toolbar">
          <button className="EventsPage-btn">+ Назначить событие</button>
          <span className="EventsPage-hint">
            Напоминания отправляются через Telegram-бота и e-mail.
          </span>
        </div>
        <div className="EventsPage-list">
          {mockEvents.map((e) => (
            <div key={e.id} className="EventsPage-item">
              <div className="EventsPage-icon">
                {e.type === 'call' ? '✆' : e.type === 'lab' ? '☷' : '•'}
              </div>
              <div className="EventsPage-main">
                <div className="EventsPage-title">{e.title}</div>
                <div className="EventsPage-sub">
                  {e.client} · {e.datetime} · {e.channel}
                </div>
              </div>
              <div className="EventsPage-status">
                {e.status === 'scheduled' ? (
                  <Tag label="запланировано" color="blue" subtle />
                ) : (
                  <Tag label="проведено" color="green" subtle />
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
