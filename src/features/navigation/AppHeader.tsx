
import React from 'react';
import './AppHeader.css';
import { PillTabs } from '../../components/PillTabs/PillTabs';
import type { AppRoute } from './useAppNavigation';

type AppHeaderProps = {
  onRouteChange: (route: AppRoute) => void;
};

export const AppHeader: React.FC<AppHeaderProps> = ({ onRouteChange }) => {
  const [view, setView] = React.useState<'system' | 'bot' | 'data'>('system');

  const subtitle =
    view === 'system'
      ? 'Единое представление backend-сервисов, дэшборда и Telegram-бота.'
      : view === 'bot'
      ? 'Потоки взаимодействия с ботом и webhooks в backend API.'
      : 'Модель данных: клиенты, питание, анализы, меню, события и тарифы.';

  return (
    <div className="AppHeaderRoot">
      <div className="AppHeader-left">
        <div className="AppHeader-title">
          SDD: Система мониторинга питания клиентов
        </div>
        <div className="AppHeader-sub">{subtitle}</div>
      </div>
      <div className="AppHeader-right">
        <PillTabs
          size="sm"
          value={view}
          onChange={(val) => setView(val as typeof view)}
          options={[
            { id: 'system', label: 'Архитектура' },
            { id: 'bot', label: 'Telegram-бот' },
            { id: 'data', label: 'Модель данных' },
          ]}
        />
        <div className="AppHeader-actions">
          <button
            className="AppHeader-btn"
            onClick={() => onRouteChange('dashboard')}
          >
            Дэшборд
          </button>
          <button
            className="AppHeader-btn AppHeader-btn--primary"
            onClick={() => onRouteChange('clients')}
          >
            Перейти к клиентам
          </button>
        </div>
      </div>
    </div>
  );
};
