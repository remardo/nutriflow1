
export type ClientFlag = 'ok' | 'proteinLow' | 'fiberLow' | 'overKcal';

export type ClientSummary = {
  id: string;
  name: string;
  goal: string;
  status: 'active' | 'pause';
  proteinCoverage: number;
  fiberCoverage: number;
  kcalCoverage: number;
  riskFlags: ClientFlag[];
};

export type EventItem = {
  id: string;
  clientName: string;
  type: string;
  label: string;
  datetime: string;
  channel: string;
  status: 'scheduled' | 'done' | 'alert';
};

export type NotificationItem = {
  id: string;
  clientName: string;
  type: string;
  message: string;
  createdAt: string;
  severity: 'info' | 'warning' | 'critical';
};

export const mockClients: ClientSummary[] = [
  {
    id: 'c1',
    name: 'Анна Петрова',
    goal: 'Похудение · -6 кг',
    status: 'active',
    proteinCoverage: 0.93,
    fiberCoverage: 0.71,
    kcalCoverage: 0.88,
    riskFlags: ['fiberLow'],
  },
  {
    id: 'c2',
    name: 'Игорь Смирнов',
    goal: 'Набор мышц · +4 кг',
    status: 'active',
    proteinCoverage: 0.64,
    fiberCoverage: 0.94,
    kcalCoverage: 0.78,
    riskFlags: ['proteinLow'],
  },
  {
    id: 'c3',
    name: 'Мария Лебедева',
    goal: 'Поддержание · ЖКТ',
    status: 'pause',
    proteinCoverage: 1.02,
    fiberCoverage: 1.10,
    kcalCoverage: 1.01,
    riskFlags: ['ok'],
  },
];

export const mockEvents: EventItem[] = [
  {
    id: 'e1',
    clientName: 'Анна Петрова',
    type: 'lab',
    label: 'Контроль ферритина',
    datetime: 'Сегодня · 19:30',
    channel: 'Клиника / загрузить результат',
    status: 'scheduled',
  },
  {
    id: 'e2',
    clientName: 'Игорь Смирнов',
    type: 'call',
    label: 'Разбор дневника за неделю',
    datetime: 'Завтра · 11:00',
    channel: 'Zoom',
    status: 'scheduled',
  },
  {
    id: 'e3',
    clientName: 'Мария Лебедева',
    type: 'check',
    label: 'Напоминание: вода и клетчатка',
    datetime: 'Вчера',
    channel: 'Telegram',
    status: 'done',
  },
];

export const mockNotifications: NotificationItem[] = [
  {
    id: 'n1',
    clientName: 'Анна',
    type: 'fiberLow',
    message: '3-й день подряд недобор клетчатки (<70% от нормы).',
    createdAt: '1 ч назад',
    severity: 'warning',
  },
  {
    id: 'n2',
    clientName: 'Игорь',
    type: 'proteinLow',
    message: 'Белок: 0.9 г/кг при цели 1.6 г/кг.',
    createdAt: '3 ч назад',
    severity: 'critical',
  },
  {
    id: 'n3',
    clientName: 'Мария',
    type: 'ok',
    message: 'Все ключевые нутриенты в целевых диапазонах.',
    createdAt: '6 ч назад',
    severity: 'info',
  },
];
