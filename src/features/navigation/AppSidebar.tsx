
import React from 'react';
import './AppSidebar.css';
import type { AppRoute } from './useAppNavigation';

type SidebarProps = {
  activeRoute: AppRoute;
  onRouteChange: (route: AppRoute) => void;
};

type NavItem = {
  id: AppRoute;
  label: string;
  icon: string;
};

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Дэшборд', icon: '◦' },
  { id: 'clients', label: 'Клиенты', icon: '◎' },
  { id: 'client-profile', label: 'Профиль', icon: '✦' },
  { id: 'menu', label: 'Меню', icon: '▤' },
  { id: 'labs', label: 'Анализы', icon: '☷' },
  { id: 'events', label: 'События', icon: '⏱' },
  { id: 'telegram', label: 'Telegram-бот', icon: '✉︎' },
  { id: 'billing', label: 'Тариф', icon: '₽' },
];

export const AppSidebar: React.FC<SidebarProps> = ({ activeRoute, onRouteChange }) => {
  return (
    <div className="SidebarRoot">
      <div className="Sidebar-logo">
        <div className="Sidebar-logo-glyph">ν</div>
        <div className="Sidebar-logo-text">
          <div className="Sidebar-logo-title">NutriFlow</div>
          <div className="Sidebar-logo-sub">SDD Studio</div>
        </div>
      </div>
      <div className="Sidebar-pill">
        <div className="badge">
          <div className="badge-dot" />
          Архитектура первой версии
        </div>
        <div className="Sidebar-pill-text">
          Интерактивный обзор системы мониторинга питания с Telegram-ботом.
        </div>
      </div>
      <nav className="Sidebar-nav">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            className={
              'Sidebar-nav-item' +
              (activeRoute === item.id ? ' is-active' : '') +
              (item.id === 'client-profile' && !['client-profile'].includes(activeRoute)
                ? ' is-subtle'
                : '')
            }
            onClick={() => onRouteChange(item.id)}
          >
            <span className="Sidebar-nav-icon">{item.icon}</span>
            <span className="Sidebar-nav-label">{item.label}</span>
          </button>
        ))}
      </nav>
      <div className="Sidebar-footer">
        <div className="Sidebar-footer-label">Фокус</div>
        <div className="Sidebar-footer-text">
          1 нутрициолог → несколько клиентов.
          ИИ и расширенные функции — как вторая очередь.
        </div>
      </div>
    </div>
  );
};
