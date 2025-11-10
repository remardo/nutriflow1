
import React from 'react';
import './MenuBuilder.css';
import { Card } from '../../components/Card/Card';
import { Tag } from '../../components/Tag/Tag';
import { fetchMenuTemplates, MenuTemplateDto } from '../../api/menu';

type MenuMeal = {
  id: string;
  type: 'Завтрак' | 'Обед' | 'Ужин' | 'Перекус';
  description: string;
  kcal: number;
  protein: number;
  fiber: number;
};

type MenuDay = {
  id: string;
  label: string;
  meals: MenuMeal[];
};

const mockWeek: MenuDay[] = [
  {
    id: 'd1',
    label: 'Пн',
    meals: [
      {
        id: 'm1',
        type: 'Завтрак',
        description: 'Овсянка с ягодами и орехами',
        kcal: 420,
        protein: 18,
        fiber: 7,
      },
      {
        id: 'm2',
        type: 'Обед',
        description: 'Гречка, индейка, салат',
        kcal: 520,
        protein: 36,
        fiber: 5,
      },
    ],
  },
  {
    id: 'd2',
    label: 'Вт',
    meals: [
      {
        id: 'm3',
        type: 'Завтрак',
        description: 'Йогурт, гранола, фрукты',
        kcal: 380,
        protein: 16,
        fiber: 4,
      },
    ],
  },
];

export const MenuBuilder: React.FC = () => {
  const [selectedDayId, setSelectedDayId] = React.useState<string>('d1');
  const selectedDay = mockWeek.find((d) => d.id === selectedDayId) ?? mockWeek[0];

  const totalKcal = selectedDay.meals.reduce((sum, m) => sum + m.kcal, 0);
  const totalProtein = selectedDay.meals.reduce((sum, m) => sum + m.protein, 0);
  const totalFiber = selectedDay.meals.reduce((sum, m) => sum + m.fiber, 0);

  const [aiPrompt, setAiPrompt] = React.useState(
    'Женщина, 30 лет, цели: минус 6 кг, ферритин низкий, без лактозы.'
  );
  const [aiDraft, setAiDraft] = React.useState(
    'AI-подсказка: добавить 2–3 порции красного мяса в неделю, источники витамина C, цель по клетчатке ≥ 25 г/сут.'
  );

  // Загрузка реальных шаблонов меню (демонстрация интеграции с backend)
  const [templates, setTemplates] = React.useState<MenuTemplateDto[]>([]);
  const [loadingTemplates, setLoadingTemplates] = React.useState(false);
  const [templatesError, setTemplatesError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      setLoadingTemplates(true);
      setTemplatesError(null);
      try {
        const data = await fetchMenuTemplates();
        if (mounted) {
          setTemplates(data);
        }
      } catch (_e) {
        if (mounted) {
          setTemplatesError('Не удалось загрузить шаблоны меню');
        }
      } finally {
        if (mounted) {
          setLoadingTemplates(false);
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="MenuBuilderRoot">
      <Card
        title="Конструктор меню"
        subtitle="Menu & Recommendations Service + экспорт в Telegram"
      >
        <div className="MenuBuilder-top">
          <div className="MenuBuilder-templates">
            <div className="MenuBuilder-templates-title">
              Доступные шаблоны меню (из backend)
            </div>
            {loadingTemplates && (
              <div className="MenuBuilder-templates-note">
                Загрузка...
              </div>
            )}
            {templatesError && (
              <div className="MenuBuilder-templates-error">
                {templatesError}
              </div>
            )}
            {!loadingTemplates && !templatesError && templates.length === 0 && (
              <div className="MenuBuilder-templates-note">
                Шаблоны меню ещё не созданы.
              </div>
            )}
            {!loadingTemplates && !templatesError && templates.length > 0 && (
              <ul className="MenuBuilder-templates-list">
                {templates.slice(0, 5).map((t) => (
                  <li key={t.id} className="MenuBuilder-templates-item">
                    <strong>{t.name}</strong>
                    {t.focus && <> · {t.focus}</>}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="MenuBuilder-days">
            {mockWeek.map((d) => (
              <button
                key={d.id}
                className={
                  'MenuBuilder-day' +
                  (selectedDayId === d.id ? ' is-active' : '')
                }
                onClick={() => setSelectedDayId(d.id)}
              >
                {d.label}
              </button>
            ))}
            <button className="MenuBuilder-day is-ghost">+</button>
          </div>
          <div className="MenuBuilder-summary">
            <span>{totalKcal} ккал</span>
            <span>{totalProtein} г Б</span>
            <span>{totalFiber} г клетчатки</span>
          </div>
        </div>
        <div className="MenuBuilder-layout">
          <div className="MenuBuilder-meals">
            {selectedDay.meals.map((m) => (
              <div key={m.id} className="MenuBuilder-meal">
                <div className="MenuBuilder-meal-type">{m.type}</div>
                <div className="MenuBuilder-meal-desc">{m.description}</div>
                <div className="MenuBuilder-meal-macros">
                  {m.kcal} ккал · {m.protein} г Б · {m.fiber} г клетчатки
                </div>
              </div>
            ))}
            <button className="MenuBuilder-add">+ Добавить приём пищи</button>
          </div>
          <div className="MenuBuilder-ai">
            <div className="MenuBuilder-ai-label">
              AI Draft (V2, опционально)
            </div>
            <textarea
              className="MenuBuilder-ai-textarea"
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
            />
            <div className="MenuBuilder-ai-draft">
              {aiDraft}
            </div>
            <div className="MenuBuilder-ai-actions">
              <button
                className="MenuBuilder-btn"
                onClick={() =>
                  setAiDraft(
                    'Готов пример недельного меню. В реальной системе здесь вызывается внешний AI-сервис.'
                  )
                }
              >
                Сгенерировать меню (mock)
              </button>
              <button className="MenuBuilder-btn MenuBuilder-btn--primary">
                Отправить меню клиенту в Telegram
              </button>
            </div>
            <Tag
              label="В реальной реализации: отдельный AI-сервис + очереди"
              color="blue"
              subtle
            />
          </div>
        </div>
      </Card>
    </div>
  );
};
