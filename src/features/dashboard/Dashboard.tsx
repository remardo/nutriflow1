
import React from 'react';
import './Dashboard.css';
import { Card } from '../../components/Card/Card';
import { MetricBar } from '../../components/MetricBar/MetricBar';
import { Tag } from '../../components/Tag/Tag';
import { fetchDashboardSummary, DashboardSummary } from '../../api/dashboard';

type DashboardProps = {
  onSelectClient: (clientId: string) => void;
};

export const Dashboard: React.FC<DashboardProps> = ({ onSelectClient }) => {
  const [summary, setSummary] = React.useState<DashboardSummary | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await fetchDashboardSummary();
        if (mounted) {
          setSummary(data);
          setError(null);
        }
      } catch (e) {
        if (mounted) {
          setError('Не удалось загрузить сводку по системе');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const totalClients = summary?.totalClients ?? 0;
  const activeClients = summary?.activeClients ?? 0;
  const systemStats = {
    ok: summary?.risks.ok ?? 0,
    protein: summary?.risks.proteinLow ?? 0,
    fiber: summary?.risks.fiberLow ?? 0,
  };
  const upcomingEventsCount = summary?.eventsUpcomingCount ?? 0;
  const clientsWithActiveMenu = summary?.menu?.clientsWithActiveMenu ?? 0;
  const labsLowRiskClients = summary?.labs?.lowRiskClients ?? 0;

  return (
    <div className="DashboardRoot">
      <div className="Dashboard-grid">
        <Card
          title="Обзор клиентов"
          subtitle="Свёртка по КБЖУ и нутриентам за сегодня"
          right={
            <div className="Dashboard-kpi">
              <span>{activeClients}</span>
              <label>активных</label>
            </div>
          }
        >
          <div className="Dashboard-kpi-row">
            <div className="Dashboard-kpi-item">
              <div className="Dashboard-kpi-label">Клиенты в норме</div>
              <div className="Dashboard-kpi-value">{systemStats.ok}%</div>
            </div>
            <div className="Dashboard-kpi-item">
              <div className="Dashboard-kpi-label">Недобор белка</div>
              <div className="Dashboard-kpi-value warn">
                {systemStats.protein}%
              </div>
            </div>
            <div className="Dashboard-kpi-item">
              <div className="Dashboard-kpi-label">Недобор клетчатки</div>
              <div className="Dashboard-kpi-value warn">
                {systemStats.fiber}%
              </div>
            </div>
            <div className="Dashboard-kpi-item">
              <div className="Dashboard-kpi-label">
                Клиенты с активным меню
              </div>
              <div className="Dashboard-kpi-value">
                {clientsWithActiveMenu}
              </div>
            </div>
            <div className="Dashboard-kpi-item">
              <div className="Dashboard-kpi-label">
                Клиенты с LOW по ключевым маркерам
              </div>
              <div className="Dashboard-kpi-value warn">
                {labsLowRiskClients}
              </div>
            </div>
          </div>
          {loading && (
            <div className="Dashboard-status">Загрузка данных...</div>
          )}
          {error && (
            <div className="Dashboard-status Dashboard-status--error">
              {error}
            </div>
          )}
          {/* Для полной таблицы клиентов можно позже использовать /api/clients.
              Сейчас карточка показывает агрегаты; список клиентов реализован отдельным экраном. */}
        </Card>

        <Card
          title="События и контрольные точки"
          subtitle="Встречи, анализы, ключевые напоминания"
          compact
        >
          <div className="Dashboard-events-header">
            <div className="Dashboard-kpi">
              <span>{upcomingEventsCount}</span>
              <label>событий в ближайшие 7 дней</label>
            </div>
          </div>
          <div className="Dashboard-events">
            {summary?.events && summary.events.length > 0 ? (
              summary.events.map((e) => (
                <div key={e.id} className="Dashboard-event">
                  <div className="Dashboard-event-icon">
                    {e.type === 'lab'
                      ? '☷'
                      : e.type === 'call'
                      ? '✆'
                      : '•'}
                  </div>
                  <div className="Dashboard-event-main">
                    <div className="Dashboard-event-label">{e.title}</div>
                    <div className="Dashboard-event-sub">
                      {e.scheduledAt &&
                        new Date(e.scheduledAt).toLocaleString()}
                      {e.channel ? ` · ${e.channel}` : ''}
                    </div>
                  </div>
                  <div className="Dashboard-event-status">
                    <Tag label="событие" color="blue" subtle />
                  </div>
                </div>
              ))
            ) : (
              <div className="Dashboard-event-sub">
                Ближайших событий нет или они ещё не заведены.
              </div>
            )}
          </div>
        </Card>

        <Card
          title="Лента сигналов"
          subtitle="Автоматические уведомления Nutrition Analysis Service"
          compact
        >
          <div className="Dashboard-notifications">
            {/* Здесь в следующем шаге можно добавить отдельный эндпоинт уведомлений.
                Пока блок остаётся как техническая заглушка под будущую реализацию. */}
            <div className="Dashboard-notification">
              <div
                className="Dashboard-notification-dot"
                data-severity="info"
              />
              <div className="Dashboard-notification-main">
                <div className="Dashboard-notification-text">
                  Используются реальные агрегаты из /api/dashboard/summary.
                </div>
                <div className="Dashboard-notification-sub">
                  Лента уведомлений подключается на следующем этапе.
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card
          title="Технологическая перспектива"
          subtitle="Структура backend-сервисов (SDD слой)"
          compact
        >
          <div className="Dashboard-architecture">
            <div className="Dashboard-arch-column">
              <div className="Dashboard-arch-title">Внешние интерфейсы</div>
              <ul>
                <li>Telegram Bot API (webhook → Bot Service)</li>
                <li>Веб-панель нутрициолога (SPA)</li>
                <li>Лёгкий кабинет клиента (опционально)</li>
              </ul>
            </div>
            <div className="Dashboard-arch-column">
              <div className="Dashboard-arch-title">Доменные сервисы</div>
              <ul>
                <li>Nutrition Analysis Service</li>
                <li>Lab Tests Service</li>
                <li>Menu & Recommendations</li>
                <li>Events & Scheduling</li>
                <li>Billing & Subscription</li>
              </ul>
            </div>
            <div className="Dashboard-arch-column">
              <div className="Dashboard-arch-title">Хранилище</div>
              <ul>
                <li>PostgreSQL: клиенты, приемы пищи, меню, анализы</li>
                <li>Object Storage: фото, файлы анализов</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

