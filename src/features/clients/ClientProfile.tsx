
import React from 'react';
import './ClientProfile.css';
import { Card } from '../../components/Card/Card';
import { MetricBar } from '../../components/MetricBar/MetricBar';
import { DataList } from '../../components/DataList/DataList';
import { Tag } from '../../components/Tag/Tag';
import {
  fetchClientProfile,
  ClientProfile as ClientProfileDto,
  updateClientNorms,
  ClientNormsPayload,
} from '../../api/clients';
import {
  fetchMenuTemplates,
  assignMenu,
  MenuTemplateDto,
} from '../../api/menu';
import {
  getClientLabSummary,
  LabSummaryItemDto,
} from '../../api/labs';

type ClientProfileProps = {
  clientId: string | null;
  onBackToList: () => void;
};

export const ClientProfile: React.FC<ClientProfileProps> = ({
  clientId,
  onBackToList,
}) => {
  const [profile, setProfile] = React.useState<ClientProfileDto | null>(null);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);

  const [editingNorms, setEditingNorms] = React.useState(false);
  const [normsDraft, setNormsDraft] = React.useState<ClientNormsPayload>({});
  const [savingNorms, setSavingNorms] = React.useState(false);
  const [normsError, setNormsError] = React.useState<string | null>(null);

  const [menuTemplates, setMenuTemplates] = React.useState<MenuTemplateDto[]>(
    []
  );
  const [menuLoading, setMenuLoading] = React.useState(false);
  const [menuError, setMenuError] = React.useState<string | null>(null);
  const [selectedMenuId, setSelectedMenuId] = React.useState<string>('');
  const [assigningMenu, setAssigningMenu] = React.useState(false);

  const [labSummary, setLabSummary] = React.useState<LabSummaryItemDto[] | null>(null);
  const [labSummaryLoading, setLabSummaryLoading] = React.useState(false);
  const [labSummaryError, setLabSummaryError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!clientId) {
      setProfile(null);
      return;
    }
    let mounted = true;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const data = await fetchClientProfile(clientId);
        if (mounted) {
          setProfile(data);
        }
      } catch (e) {
        if (mounted) {
          setError('Не удалось загрузить профиль клиента');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [clientId]);

  // Загружаем summary по анализам при выборе клиента
  React.useEffect(() => {
    if (!clientId) {
      setLabSummary(null);
      return;
    }
    let mounted = true;
    setLabSummaryLoading(true);
    setLabSummaryError(null);
    (async () => {
      try {
        const markers = await getClientLabSummary(clientId);
        if (mounted) {
          // Отображаем только несколько ключевых маркеров (если есть)
          const priority = ['FERRITIN', 'VITD25OH', 'HB'];
          const sorted = [...markers].sort((a, b) => {
            const ia = priority.indexOf(a.marker);
            const ib = priority.indexOf(b.marker);
            if (ia !== -1 && ib !== -1) return ia - ib;
            if (ia !== -1) return -1;
            if (ib !== -1) return 1;
            return a.marker.localeCompare(b.marker);
          });
          setLabSummary(sorted.slice(0, 5));
        }
      } catch (_e) {
        if (mounted) {
          setLabSummaryError('Не удалось загрузить сводку анализов');
        }
      } finally {
        if (mounted) {
          setLabSummaryLoading(false);
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, [clientId]);

  // Подгружаем шаблоны меню один раз при монтировании
  React.useEffect(() => {
    let mounted = true;
    (async () => {
      setMenuLoading(true);
      setMenuError(null);
      try {
        const templates = await fetchMenuTemplates();
        if (mounted) {
          setMenuTemplates(templates);
        }
      } catch (_e) {
        if (mounted) {
          setMenuError('Не удалось загрузить шаблоны меню');
        }
      } finally {
        if (mounted) {
          setMenuLoading(false);
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const startEditNorms = () => {
    if (!profile) return;
    setNormsError(null);
    setNormsDraft({
      kcalMin: profile.norms?.kcalMin ?? undefined,
      kcalMax: profile.norms?.kcalMax ?? undefined,
      proteinGrams: profile.norms?.proteinGrams ?? undefined,
      fatGramsMin: profile.norms?.fatGramsMin ?? undefined,
      fatGramsMax: profile.norms?.fatGramsMax ?? undefined,
      carbsGramsMin: profile.norms?.carbsGramsMin ?? undefined,
      carbsGramsMax: profile.norms?.carbsGramsMax ?? undefined,
      fiberGrams: profile.norms?.fiberGrams ?? undefined,
    });
    setEditingNorms(true);
  };

  const cancelEditNorms = () => {
    setEditingNorms(false);
    setNormsError(null);
  };

  const handleNormChange = (field: keyof ClientNormsPayload, value: string) => {
    const num = value === '' ? undefined : Number(value);
    setNormsDraft((prev) => ({
      ...prev,
      [field]: Number.isNaN(num) ? undefined : num,
    }));
  };

  const handleSaveNorms = async () => {
    if (!clientId) return;
    setSavingNorms(true);
    setNormsError(null);
    try {
      const updated = await updateClientNorms(clientId, normsDraft);
      setProfile(updated);
      setEditingNorms(false);
    } catch (e: any) {
      setNormsError(
        e?.response?.data?.error ||
          'Не удалось сохранить нормы. Проверьте введённые значения.'
      );
    } finally {
      setSavingNorms(false);
    }
  };

  if (!clientId) {
    return (
      <div className="ClientProfileRoot">
        <div className="ClientProfile-headerRow">
          <button className="ClientProfile-back" onClick={onBackToList}>
            ← К списку клиентов
          </button>
          <div className="ClientProfile-titleBlock">
            <div className="ClientProfile-name">Клиент не выбран</div>
            <div className="ClientProfile-sub">
              Выберите клиента в списке слева, чтобы увидеть детали профиля.
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading && !profile) {
    return (
      <div className="ClientProfileRoot">
        <div className="ClientProfile-headerRow">
          <button className="ClientProfile-back" onClick={onBackToList}>
            ← К списку клиентов
          </button>
          <div className="ClientProfile-titleBlock">
            <div className="ClientProfile-name">Загрузка профиля...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="ClientProfileRoot">
        <div className="ClientProfile-headerRow">
          <button className="ClientProfile-back" onClick={onBackToList}>
            ← К списку клиентов
          </button>
          <div className="ClientProfile-titleBlock">
            <div className="ClientProfile-name">Ошибка</div>
            <div className="ClientProfile-sub">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  const client = profile;

  return (
    <div className="ClientProfileRoot">
      <div className="ClientProfile-headerRow">
        <button className="ClientProfile-back" onClick={onBackToList}>
          ← К списку клиентов
        </button>
        <div className="ClientProfile-titleBlock">
          <div className="ClientProfile-name">{client.name}</div>
          <div className="ClientProfile-sub">
            Цель: {client.goal || 'не указана'} ·{' '}
            {client.status === 'active' ? 'активен' : 'на паузе'}
          </div>
        </div>
        <div className="ClientProfile-tags">
          <Tag label="Данные с backend" color="blue" subtle />
          <Tag label="Редактирует нутрициолог" color="green" subtle />
        </div>
      </div>

      <div className="ClientProfile-grid">
        <Card
          title="Питание сегодня"
          subtitle="Агрегация по приёмам пищи (ClientDayStats)"
        >
          <div className="ClientProfile-metrics">
            {client.dayStats && (
              <>
                <MetricBar
                  label="Калории"
                  value={client.dayStats.kcal ?? 0}
                  target={client.norms?.kcalMax ?? 2000}
                  unit="ккал"
                />
                <MetricBar
                  label="Белок"
                  value={client.dayStats.protein ?? 0}
                  target={client.norms?.proteinGrams ?? 120}
                  unit="г"
                />
                <MetricBar
                  label="Клетчатка"
                  value={client.dayStats.fiber ?? 0}
                  target={client.norms?.fiberGrams ?? 25}
                  unit="г"
                />
              </>
            )}
            {/* TODO: подключить реальные агрегаты по ЖБУ и клетчатке при появлении API */}
            <MetricBar label="Жиры" value={78} target={70} unit="г" />
            <MetricBar label="Углеводы" value={230} target={240} unit="г" />
          </div>
          <div className="ClientProfile-metrics-note">
            Данные формируются Nutrition Analysis Service на основе Meal и норм клиента.
          </div>
        </Card>

        <Card
          title="Нормы клиента"
          subtitle="ClientNutrientNorms: гибкая настройка"
        >
          <div className="ClientProfile-norms-header">
            {!editingNorms && (
              <button
                className="ClientProfile-btn ClientProfile-btn--primary"
                onClick={startEditNorms}
              >
                Редактировать нормы
              </button>
            )}
            {editingNorms && (
              <>
                <button
                  className="ClientProfile-btn"
                  onClick={cancelEditNorms}
                  disabled={savingNorms}
                >
                  Отмена
                </button>
                <button
                  className="ClientProfile-btn ClientProfile-btn--primary"
                  onClick={handleSaveNorms}
                  disabled={savingNorms}
                >
                  {savingNorms ? 'Сохранение...' : 'Сохранить'}
                </button>
              </>
            )}
          </div>

          {normsError && (
            <div className="ClientProfile-error">
              {normsError}
            </div>
          )}

          {!editingNorms && client.norms && (
            <>
              <DataList
                columns={2}
                items={[
                  {
                    label: 'Калории',
                    value:
                      client.norms.kcalMin || client.norms.kcalMax
                        ? `${client.norms.kcalMin || ''}–${client.norms.kcalMax || ''} ккал`
                        : 'не заданы',
                  },
                  {
                    label: 'Белок',
                    value: client.norms.proteinGrams
                      ? `${client.norms.proteinGrams} г`
                      : 'не задано',
                  },
                  {
                    label: 'Жиры',
                    value:
                      client.norms.fatGramsMin || client.norms.fatGramsMax
                        ? `${client.norms.fatGramsMin || ''}–${client.norms.fatGramsMax || ''} г`
                        : 'не заданы',
                  },
                  {
                    label: 'Углеводы',
                    value:
                      client.norms.carbsGramsMin || client.norms.carbsGramsMax
                        ? `${client.norms.carbsGramsMin || ''}–${client.norms.carbsGramsMax || ''} г`
                        : 'не заданы',
                  },
                  {
                    label: 'Клетчатка',
                    value: client.norms.fiberGrams
                      ? `≥ ${client.norms.fiberGrams} г`
                      : 'не задано',
                  },
                ]}
              />
              <div className="ClientProfile-metrics-note">
                Редактируется нутрициологом в админ-панели. Клиент видит целевые ориентиры.
              </div>
            </>
          )}

          {!editingNorms && !client.norms && (
            <div className="ClientProfile-metrics-note">
              Нормы для клиента ещё не настроены.
            </div>
          )}

          {editingNorms && (
            <div className="ClientProfile-norms-form">
              <div className="ClientProfile-norms-grid">
                <label>
                  Калории от
                  <input
                    type="number"
                    value={normsDraft.kcalMin ?? ''}
                    onChange={(e) => handleNormChange('kcalMin', e.target.value)}
                  />
                </label>
                <label>
                  до
                  <input
                    type="number"
                    value={normsDraft.kcalMax ?? ''}
                    onChange={(e) => handleNormChange('kcalMax', e.target.value)}
                  />
                </label>
                <label>
                  Белок, г
                  <input
                    type="number"
                    value={normsDraft.proteinGrams ?? ''}
                    onChange={(e) =>
                      handleNormChange('proteinGrams', e.target.value)
                    }
                  />
                </label>
                <label>
                  Жиры от, г
                  <input
                    type="number"
                    value={normsDraft.fatGramsMin ?? ''}
                    onChange={(e) =>
                      handleNormChange('fatGramsMin', e.target.value)
                    }
                  />
                </label>
                <label>
                  Жиры до, г
                  <input
                    type="number"
                    value={normsDraft.fatGramsMax ?? ''}
                    onChange={(e) =>
                      handleNormChange('fatGramsMax', e.target.value)
                    }
                  />
                </label>
                <label>
                  Углеводы от, г
                  <input
                    type="number"
                    value={normsDraft.carbsGramsMin ?? ''}
                    onChange={(e) =>
                      handleNormChange('carbsGramsMin', e.target.value)
                    }
                  />
                </label>
                <label>
                  Углеводы до, г
                  <input
                    type="number"
                    value={normsDraft.carbsGramsMax ?? ''}
                    onChange={(e) =>
                      handleNormChange('carbsGramsMax', e.target.value)
                    }
                  />
                </label>
                <label>
                  Клетчатка, г
                  <input
                    type="number"
                    value={normsDraft.fiberGrams ?? ''}
                    onChange={(e) =>
                      handleNormChange('fiberGrams', e.target.value)
                    }
                  />
                </label>
              </div>
              <div className="ClientProfile-metrics-note">
                Заполните только те поля, которые хотите обновить. Остальные останутся без изменений.
              </div>
            </div>
          )}
        </Card>

        <Card
          title="Лента приёмов пищи"
          subtitle="Meal: данные из input-каналов"
          compact
        >
          <div className="ClientProfile-meals">
            <div className="ClientProfile-meal">
              <div className="ClientProfile-meal-body">
                Подключение реальной ленты приёмов пищи выполняется на следующем этапе
                реализации API /meals и агрегаций. Сейчас используется агрегированный блок выше.
              </div>
            </div>
          </div>
        </Card>

        <Card
          title="Ключевые анализы"
          subtitle="Живые данные по основным маркерам из backend /labs/summary"
          compact
        >
          <div className="ClientProfile-labs">
            {labSummaryLoading && (
              <div className="ClientProfile-lab-note">
                Загрузка сводки анализов...
              </div>
            )}
            {labSummaryError && (
              <div className="ClientProfile-error">{labSummaryError}</div>
            )}
            {!labSummaryLoading &&
              !labSummaryError &&
              (!labSummary || labSummary.length === 0) && (
                <div className="ClientProfile-lab-note">
                  Анализы для клиента ещё не добавлены.
                </div>
              )}
            {!labSummaryLoading &&
              !labSummaryError &&
              labSummary &&
              labSummary.length > 0 &&
              labSummary.map((m) => {
                const statusLabel =
                  m.status === 'LOW'
                    ? 'ниже нормы'
                    : m.status === 'HIGH'
                    ? 'выше нормы'
                    : 'в норме';
                const statusClass =
                  m.status === 'LOW'
                    ? 'low'
                    : m.status === 'HIGH'
                    ? 'high'
                    : 'ok';
                const trendLabel =
                  m.trend === 'up'
                    ? '↑ рост'
                    : m.trend === 'down'
                    ? '↓ снижение'
                    : '→ стабильно';
                const deltaText =
                  m.delta != null && m.delta !== 0
                    ? ` (${m.delta > 0 ? '+' : ''}${m.delta})`
                    : '';
                return (
                  <div key={m.marker} className="ClientProfile-lab-row">
                    <span className="ClientProfile-lab-label">
                      {m.name || m.marker}
                    </span>
                    <span
                      className={
                        'ClientProfile-lab-value ' + statusClass
                      }
                    >
                      {m.lastValue} {m.unit}{' '}
                      <span className="ClientProfile-lab-status-label">
                        {statusLabel}
                      </span>
                    </span>
                    <span className="ClientProfile-lab-note">
                      {new Date(m.lastTakenAt).toLocaleDateString()} · {trendLabel}
                      {deltaText}
                    </span>
                  </div>
                );
              })}
          </div>
          <div className="ClientProfile-metrics-note">
            Сводка формируется по последним значениям и трендам, помогающим в
            выборе рекомендаций и меню.
          </div>
        </Card>

        <Card
          title="Меню и рекомендации"
          subtitle="MenuAssignment + MenuTemplate"
          compact
        >
          <div className="ClientProfile-menu">
            {client.activeMenu ? (
              <>
                <div className="ClientProfile-menu-block">
                  <div className="ClientProfile-menu-label">Активное меню</div>
                  <div className="ClientProfile-menu-title">
                    {client.activeMenu.menuTemplate.name}
                  </div>
                  <div className="ClientProfile-menu-text">
                    {client.activeMenu.menuTemplate.description ||
                      client.activeMenu.menuTemplate.focus ||
                      'Персонализированное меню клиента.'}
                  </div>
                </div>
              </>
            ) : (
              <div className="ClientProfile-menu-text">
                Активное меню не назначено.
              </div>
            )}

            <div className="ClientProfile-menu-assign">
              <div className="ClientProfile-menu-label">Назначить меню</div>
              {menuLoading && (
                <div className="ClientProfile-menu-text">
                  Загрузка шаблонов меню...
                </div>
              )}
              {menuError && (
                <div className="ClientProfile-error">
                  {menuError}
                </div>
              )}
              {!menuLoading && !menuError && menuTemplates.length === 0 && (
                <div className="ClientProfile-menu-text">
                  Нет доступных шаблонов меню.
                </div>
              )}
              {!menuLoading && !menuError && menuTemplates.length > 0 && (
                <div className="ClientProfile-menu-controls">
                  <select
                    className="ClientProfile-select"
                    value={selectedMenuId}
                    onChange={(e) => setSelectedMenuId(e.target.value)}
                  >
                    <option value="">Выберите шаблон меню</option>
                    {menuTemplates.map((tpl) => (
                      <option key={tpl.id} value={tpl.id}>
                        {tpl.name}
                      </option>
                    ))}
                  </select>
                  <button
                    className="ClientProfile-btn ClientProfile-btn--primary"
                    onClick={async () => {
                      if (!clientId || !selectedMenuId || assigningMenu) {
                        return;
                      }
                      setAssigningMenu(true);
                      setMenuError(null);
                      try {
                        const updated = await assignMenu(
                          clientId,
                          selectedMenuId
                        );
                        setProfile(updated);
                        setSelectedMenuId('');
                      } catch (e: any) {
                        setMenuError(
                          e?.response?.data?.error ||
                            'Не удалось назначить меню'
                        );
                      } finally {
                        setAssigningMenu(false);
                      }
                    }}
                    disabled={!selectedMenuId || assigningMenu}
                  >
                    {assigningMenu ? 'Назначение...' : 'Назначить'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </Card>

        <Card
          title="События & уведомления"
          subtitle="Events: напоминания и ключевые точки сопровождения"
          compact
        >
          <div className="ClientProfile-events">
            {client.events.length === 0 && (
              <div className="ClientProfile-event-text">
                Для клиента пока нет событий. Создайте контрольные точки в модуле событий.
              </div>
            )}
            {client.events.map((event) => (
              <div key={event.id} className="ClientProfile-event">
                <span className="ClientProfile-event-dot" />
                <span className="ClientProfile-event-text">
                  {new Date(event.scheduledAt).toLocaleString()} — {event.title}
                  {event.channel ? ` · ${event.channel}` : ''}
                </span>
              </div>
            ))}
          </div>

          {/* Простая inline-форма добавления события.
              Минимальный контур: POST на backend и локальное обновление списка client.events. */}
          <form
            className="ClientProfile-events-form"
            onSubmit={async (e) => {
              e.preventDefault();
              if (!clientId) return;
              const form = e.currentTarget;
              const titleInput = form.elements.namedItem(
                'eventTitle'
              ) as HTMLInputElement | null;
              const dateInput = form.elements.namedItem(
                'eventDate'
              ) as HTMLInputElement | null;
              const typeInput = form.elements.namedItem(
                'eventType'
              ) as HTMLInputElement | null;
              const channelInput = form.elements.namedItem(
                'eventChannel'
              ) as HTMLInputElement | null;

              const title = titleInput?.value.trim() || '';
              const scheduledAt = dateInput?.value || '';
              const type = (typeInput?.value.trim() || 'note').toString();
              const channel = channelInput?.value.trim() || undefined;

              if (!title || !scheduledAt) {
                return;
              }

              try {
                const res = await fetch(
                  `http://localhost:4000/api/clients/${clientId}/events`,
                  {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      title,
                      scheduledAt,
                      type,
                      channel,
                    }),
                  }
                );
                if (!res.ok) {
                  // eslint-disable-next-line no-console
                  console.error('Failed to create event');
                  return;
                }
                const created = await res.json();
                setProfile({
                  ...client,
                  events: [...client.events, created],
                });
                form.reset();
              } catch (err) {
                // eslint-disable-next-line no-console
                console.error('Failed to create event', err);
              }
            }}
          >
            <div className="ClientProfile-events-grid">
              <input
                name="eventTitle"
                type="text"
                placeholder="Название события"
                className="ClientProfile-input"
              />
              <input
                name="eventDate"
                type="datetime-local"
                className="ClientProfile-input"
              />
              <input
                name="eventType"
                type="text"
                placeholder="Тип (call / checkup / reminder)"
                className="ClientProfile-input"
                defaultValue="note"
              />
              <input
                name="eventChannel"
                type="text"
                placeholder="Канал (zoom / phone / telegram)"
                className="ClientProfile-input"
              />
              <button
                type="submit"
                className="ClientProfile-btn ClientProfile-btn--primary"
              >
                Добавить
              </button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};
