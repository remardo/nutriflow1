import type { DashboardSummary } from './dashboard';
import type {
  ClientProfile,
  ClientSummary,
  ClientNormsPayload,
} from './clients';
import type { MenuTemplateDto, ClientMenuResponse } from './menu';
import type { EventDto } from './events';
import type {
  LabMarkerDto,
  LabSeriesPointDto,
  LabSummaryItemDto,
  LabTestDto,
  CreateLabBatchItem,
} from './labs';

type DemoUser = {
  id: string;
  email: string;
  name: string;
};

type DemoState = {
  user: DemoUser & { password: string };
  clients: ClientProfile[];
  menuTemplates: MenuTemplateDto[];
};

const DEMO_STATE_KEY = 'nf:demo-state';

const defaultMenuTemplates: MenuTemplateDto[] = [
  {
    id: 'tpl-balanced',
    name: 'Balanced Metabolic Reset',
    description: '3-недельный курс на снижение воспалений',
    focus: 'anti-inflammatory',
    createdAt: '2025-01-05T09:00:00.000Z',
    updatedAt: '2025-01-05T09:00:00.000Z',
  },
  {
    id: 'tpl-muscle',
    name: 'Lean Muscle Gain',
    description: 'Высокобелковые рационы с повышенной клетчаткой',
    focus: 'hypertrophy',
    createdAt: '2025-02-12T08:30:00.000Z',
    updatedAt: '2025-02-12T08:30:00.000Z',
  },
  {
    id: 'tpl-hormone',
    name: 'Hormone Balance Essentials',
    description: 'Расписание питания под поддержку щитовидной железы',
    focus: 'endocrine',
    createdAt: '2025-01-22T07:30:00.000Z',
    updatedAt: '2025-01-22T07:30:00.000Z',
  },
];

const defaultClients: ClientProfile[] = [
  {
    id: 'anna-1024',
    name: 'Анна Карелина',
    status: 'active',
    goal: 'Снизить вес на 6 кг, нормализовать ферритин',
    norms: {
      kcalMin: 1700,
      kcalMax: 2000,
      proteinGrams: 110,
      fatGramsMin: 50,
      fatGramsMax: 70,
      carbsGramsMin: 160,
      carbsGramsMax: 210,
      fiberGrams: 28,
    },
    dayStats: {
      id: 'anna-day-1',
      date: new Date().toISOString(),
      kcal: 1820,
      protein: 98,
      fat: 63,
      carbs: 190,
      fiber: 21,
      kcalCoverage: 0.92,
      proteinCoverage: 0.89,
      fiberCoverage: 0.75,
      riskFlags: ['fiberLow'],
    },
    labs: [
      {
        id: 'lab-anna-1',
        takenAt: '2025-02-05T08:00:00.000Z',
        type: 'blood',
        marker: 'FERRITIN',
        value: 28,
        unit: 'ng/mL',
        status: 'LOW',
      },
      {
        id: 'lab-anna-2',
        takenAt: '2025-01-12T08:00:00.000Z',
        type: 'blood',
        marker: 'FERRITIN',
        value: 22,
        unit: 'ng/mL',
        status: 'LOW',
      },
      {
        id: 'lab-anna-3',
        takenAt: '2025-02-01T08:00:00.000Z',
        type: 'blood',
        marker: 'VITD25OH',
        value: 34,
        unit: 'ng/mL',
        status: 'NORMAL',
      },
      {
        id: 'lab-anna-4',
        takenAt: '2025-01-04T08:00:00.000Z',
        type: 'blood',
        marker: 'HB',
        value: 122,
        unit: 'g/L',
        status: 'NORMAL',
      },
    ],
    activeMenu: {
      id: 'menu-anna-1',
      startDate: '2025-02-10',
      endDate: null,
      isActive: true,
      menuTemplate: defaultMenuTemplates[0],
    },
    events: [
      {
        id: 'anna-event-1',
        title: 'Созвон по результатам анализа',
        description: 'Обсуждаем динамику ферритина',
        type: 'call',
        scheduledAt: new Date(Date.now() + 2 * 86400000).toISOString(),
        channel: 'Zoom',
      },
      {
        id: 'anna-event-2',
        title: 'Проверка дневника питания',
        description: null,
        type: 'check',
        scheduledAt: new Date(Date.now() + 4 * 86400000).toISOString(),
        channel: 'Telegram',
      },
    ],
  },
  {
    id: 'mikhail-2048',
    name: 'Михаил Горин',
    status: 'paused',
    goal: 'Набор сухой массы +4 кг',
    norms: {
      kcalMin: 2600,
      kcalMax: 2900,
      proteinGrams: 150,
      fatGramsMin: 60,
      fatGramsMax: 80,
      carbsGramsMin: 260,
      carbsGramsMax: 320,
      fiberGrams: 30,
    },
    dayStats: {
      id: 'mih-day-1',
      date: new Date().toISOString(),
      kcal: 2400,
      protein: 134,
      fat: 78,
      carbs: 250,
      fiber: 27,
      kcalCoverage: 0.9,
      proteinCoverage: 0.89,
      fiberCoverage: 0.9,
      riskFlags: ['proteinLow'],
    },
    labs: [
      {
        id: 'lab-mih-1',
        takenAt: '2025-01-30T08:00:00.000Z',
        type: 'blood',
        marker: 'HB',
        value: 136,
        unit: 'g/L',
        status: 'NORMAL',
      },
      {
        id: 'lab-mih-2',
        takenAt: '2025-01-15T08:00:00.000Z',
        type: 'blood',
        marker: 'VITB12',
        value: 240,
        unit: 'pg/mL',
        status: 'LOW',
      },
      {
        id: 'lab-mih-3',
        takenAt: '2025-02-03T08:00:00.000Z',
        type: 'blood',
        marker: 'VITB12',
        value: 310,
        unit: 'pg/mL',
        status: 'NORMAL',
      },
    ],
    activeMenu: null,
    events: [
      {
        id: 'mih-event-1',
        title: 'Групповая тренировка (чек-ин)',
        description: 'Контроль силовых',
        type: 'call',
        scheduledAt: new Date(Date.now() + 6 * 86400000).toISOString(),
        channel: 'Telegram',
      },
    ],
  },
];

const defaultState: DemoState = {
  user: {
    id: 'demo-admin',
    email: 'admin@example.com',
    name: 'Demo нутрициолог',
    password: 'admin123',
  },
  clients: defaultClients,
  menuTemplates: defaultMenuTemplates,
};

const clone = <T>(value: T): T => {
  if (typeof structuredClone === 'function') {
    return structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value));
};

const loadState = (): DemoState => {
  if (typeof window === 'undefined' || !window.localStorage) {
    return clone(defaultState);
  }
  try {
    const raw = window.localStorage.getItem(DEMO_STATE_KEY);
    if (!raw) {
      return clone(defaultState);
    }
    const parsed = JSON.parse(raw) as DemoState;
    return {
      ...clone(defaultState),
      ...parsed,
      clients: parsed.clients?.length ? parsed.clients : defaultClients,
      menuTemplates: parsed.menuTemplates?.length
        ? parsed.menuTemplates
        : defaultMenuTemplates,
    };
  } catch {
    return clone(defaultState);
  }
};

const persistState = () => {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.setItem(DEMO_STATE_KEY, JSON.stringify(state));
  } catch {
    // ignore quota / private mode errors
  }
};

let state: DemoState = loadState();

const DEMO_ENABLED =
  typeof window === 'undefined'
    ? true
    : ((window as any).__NF_ENABLE_DEMO__ ?? true);

export const DEMO_TOKEN = 'nf-demo-token';
export const DEMO_EMAIL =
  (typeof import.meta !== 'undefined' &&
    (import.meta as any).env?.VITE_DEMO_EMAIL) ||
  state.user.email;
export const DEMO_PASSWORD =
  (typeof import.meta !== 'undefined' &&
    (import.meta as any).env?.VITE_DEMO_PASSWORD) ||
  state.user.password;

export function isDemoModeEnabled(): boolean {
  if (
    typeof import.meta !== 'undefined' &&
    (import.meta as any).env?.VITE_ENABLE_DEMO === 'false'
  ) {
    return false;
  }
  return DEMO_ENABLED;
}

export function resetDemoState(): void {
  state = clone(defaultState);
  persistState();
}

const mapClientToSummary = (client: ClientProfile): ClientSummary => {
  const coverage = client.dayStats;
  const flags: ClientSummary['riskFlags'] = coverage?.riskFlags?.length
    ? (coverage.riskFlags as ClientSummary['riskFlags'])
    : ['ok'];
  return {
    id: client.id,
    name: client.name,
    goal: client.goal,
    status: client.status,
    proteinCoverage: coverage?.proteinCoverage ?? 0.9,
    fiberCoverage: coverage?.fiberCoverage ?? 0.9,
    kcalCoverage: coverage?.kcalCoverage ?? 0.9,
    riskFlags: flags,
  };
};

const cloneClient = (client: ClientProfile): ClientProfile => clone(client);

export function demoAuthenticate(
  email: string,
  password: string
): { token: string; user: DemoUser } {
  if (!isDemoModeEnabled()) {
    throw new Error('Demo mode отключён');
  }
  if (email === DEMO_EMAIL && password === DEMO_PASSWORD) {
    return {
      token: DEMO_TOKEN,
      user: { id: state.user.id, email: DEMO_EMAIL, name: state.user.name },
    };
  }
  throw new Error('Неверный email или пароль');
}

export function demoGetCurrentUser(): DemoUser {
  if (!isDemoModeEnabled()) {
    throw new Error('Demo mode отключён');
  }
  return { id: state.user.id, email: DEMO_EMAIL, name: state.user.name };
}

export function demoFetchDashboardSummary(): DashboardSummary {
  const clients = state.clients;
  const total = clients.length;
  const active = clients.filter((c) => c.status === 'active');
  const okClients = active.filter((c) =>
    c.dayStats?.riskFlags?.every((flag) => flag === 'ok')
  );
  const proteinIssues = active.filter((c) =>
    c.dayStats?.riskFlags?.includes('proteinLow')
  );
  const fiberIssues = active.filter((c) =>
    c.dayStats?.riskFlags?.includes('fiberLow')
  );
  const upcomingEvents = clients.flatMap((c) => c.events || []);
  const nextWeek = Date.now() + 7 * 24 * 60 * 60 * 1000;
  const upcomingCount = upcomingEvents.filter(
    (e) => new Date(e.scheduledAt).getTime() <= nextWeek
  ).length;

  return {
    totalClients: total,
    activeClients: active.length,
    risks: {
      ok: Math.round((okClients.length / Math.max(active.length, 1)) * 100),
      proteinLow: Math.round(
        (proteinIssues.length / Math.max(active.length, 1)) * 100
      ),
      fiberLow: Math.round(
        (fiberIssues.length / Math.max(active.length, 1)) * 100
      ),
      overKcal: 12,
    },
    eventsUpcomingCount: upcomingCount,
    events: upcomingEvents.slice(0, 5).map((event) => ({
      id: event.id,
      clientId:
        clients.find((c) =>
          c.events.some((e) => e.id === event.id)
        )?.id || 'unknown',
      title: event.title,
      scheduledAt: event.scheduledAt,
      channel: event.channel,
      type: event.type,
    })),
    menu: {
      clientsWithActiveMenu: clients.filter((c) => !!c.activeMenu).length,
    },
    labs: {
      lowRiskClients: clients.filter((c) =>
        c.labs.every((lab) => lab.status !== 'HIGH')
      ).length,
    },
  };
}

export function demoFetchClients(): ClientSummary[] {
  return state.clients.map(mapClientToSummary);
}

export function demoFetchClientProfile(id: string): ClientProfile {
  const client = state.clients.find((c) => c.id === id);
  if (!client) {
    throw new Error('Клиент не найден');
  }
  return cloneClient(client);
}

export function demoUpdateClientNorms(
  clientId: string,
  payload: ClientNormsPayload
): ClientProfile {
  const idx = state.clients.findIndex((c) => c.id === clientId);
  if (idx === -1) {
    throw new Error('Клиент не найден');
  }
  const updated = {
    ...state.clients[idx],
    norms: {
      ...state.clients[idx].norms,
      ...payload,
    },
  };
  state.clients[idx] = updated;
  persistState();
  return cloneClient(updated);
}

export function demoFetchMenuTemplates(): MenuTemplateDto[] {
  return clone(state.menuTemplates);
}

export function demoFetchClientMenu(
  clientId: string
): ClientMenuResponse {
  const profile = demoFetchClientProfile(clientId);
  const templateFromState = profile.activeMenu
    ? state.menuTemplates.find(
        (tpl) => tpl.id === profile.activeMenu?.menuTemplate.id
      )
    : null;
  const active = profile.activeMenu
    ? [
        {
          id: profile.activeMenu.id,
          clientId: profile.id,
          menuTemplateId: profile.activeMenu.menuTemplate.id,
          startDate: profile.activeMenu.startDate,
          endDate: profile.activeMenu.endDate,
          isActive: profile.activeMenu.isActive,
          createdAt: profile.activeMenu.startDate,
          updatedAt: profile.activeMenu.startDate,
          menuTemplate:
            templateFromState ?? {
              ...profile.activeMenu.menuTemplate,
              createdAt: profile.activeMenu.startDate,
              updatedAt: profile.activeMenu.startDate,
            },
        },
      ]
    : [];
  return { active, archived: [] };
}

export function demoFetchClientEvents(clientId: string): EventDto[] {
  const client = state.clients.find((c) => c.id === clientId);
  if (!client) {
    throw new Error('Клиент не найден');
  }
  return (client.events || []).map((event) => ({
    ...event,
    clientId,
  }));
}

export function demoCreateClientEvent(
  clientId: string,
  payload: {
    title: string;
    scheduledAt: string;
    type: string;
    channel?: string;
    description?: string;
  }
): EventDto {
  const idx = state.clients.findIndex((c) => c.id === clientId);
  if (idx === -1) {
    throw new Error('Клиент не найден');
  }
  const storedEvent = {
    id: `evt-${clientId}-${Date.now()}`,
    title: payload.title,
    scheduledAt: payload.scheduledAt,
    type: payload.type,
    channel: payload.channel ?? null,
    description: payload.description ?? null,
  };

  const created: EventDto = {
    ...storedEvent,
    clientId,
  };
  state.clients[idx] = {
    ...state.clients[idx],
    events: [...(state.clients[idx].events || []), storedEvent],
  };
  persistState();
  return clone(created);
}

export function demoFetchUpcomingEvents(): EventDto[] {
  return state.clients.flatMap((c) =>
    (c.events || []).map((event) => ({
      ...event,
      clientId: c.id,
    }))
  );
}

export function demoAssignMenu(
  clientId: string,
  menuTemplateId: string,
  startDate?: string,
  endDate?: string
): ClientProfile {
  const idx = state.clients.findIndex((c) => c.id === clientId);
  if (idx === -1) {
    throw new Error('Клиент не найден');
  }
  const template = state.menuTemplates.find((t) => t.id === menuTemplateId);
  if (!template) {
    throw new Error('Шаблон не найден');
  }
  state.clients[idx] = {
    ...state.clients[idx],
    activeMenu: {
      id: `menu-${clientId}`,
      startDate: startDate || new Date().toISOString().slice(0, 10),
      endDate: endDate || null,
      isActive: true,
      menuTemplate: template,
    },
  };
  persistState();
  return cloneClient(state.clients[idx]);
}

export function demoGetClientLabs(clientId: string): LabTestDto[] {
  const client = state.clients.find((c) => c.id === clientId);
  if (!client) {
    throw new Error('Клиент не найден');
  }
  return clone(client.labs);
}

export function demoCreateClientLabsBatch(
  clientId: string,
  items: CreateLabBatchItem[]
): LabTestDto[] {
  const idx = state.clients.findIndex((c) => c.id === clientId);
  if (idx === -1) {
    throw new Error('Клиент не найден');
  }
  const now = Date.now();
  const created: LabTestDto[] = items.map((item, index) => {
    const takenAt = item.takenAt
      ? new Date(item.takenAt).toISOString()
      : new Date(now + index * 60000).toISOString();
    return {
      id: `lab-${clientId}-${now}-${index}`,
      takenAt,
      type: item.type || 'blood',
      marker: item.markerCode.toUpperCase(),
      value: item.value,
      unit: item.unit || '',
      status: item.value < 0 ? 'LOW' : 'NORMAL',
    };
  });
  state.clients[idx] = {
    ...state.clients[idx],
    labs: [...state.clients[idx].labs, ...created],
  };
  persistState();
  return clone(created);
}

export function demoGetClientLabMarkers(clientId: string): LabMarkerDto[] {
  const labs = demoGetClientLabs(clientId);
  const map = new Map<string, LabMarkerDto>();
  labs.forEach((lab) => {
    if (!map.has(lab.marker)) {
      map.set(lab.marker, {
        marker: lab.marker,
        name: lab.marker,
        unit: lab.unit,
      });
    }
  });
  return Array.from(map.values());
}

export function demoGetClientLabSeries(
  clientId: string,
  markerCode: string
): LabSeriesPointDto[] {
  const labs = demoGetClientLabs(clientId).filter(
    (lab) => lab.marker === markerCode.toUpperCase()
  );
  return labs
    .sort(
      (a, b) =>
        new Date(a.takenAt).getTime() - new Date(b.takenAt).getTime()
    )
    .map((lab) => ({
      takenAt: lab.takenAt,
      value: lab.value,
      status: lab.status,
    }));
}

const buildSummaryItem = (
  marker: string,
  labs: LabTestDto[]
): LabSummaryItemDto | null => {
  const sorted = labs
    .filter((lab) => lab.marker === marker)
    .sort(
      (a, b) =>
        new Date(b.takenAt).getTime() - new Date(a.takenAt).getTime()
    );
  if (sorted.length === 0) return null;
  const last = sorted[0];
  const prev = sorted[1];
  let trend: LabSummaryItemDto['trend'] = 'stable';
  let delta = 0;
  if (prev) {
    delta = Number((last.value - prev.value).toFixed(1));
    if (delta > 0.1) trend = 'up';
    else if (delta < -0.1) trend = 'down';
  }
  return {
    marker,
    name: marker,
    lastValue: last.value,
    unit: last.unit,
    status: last.status,
    lastTakenAt: last.takenAt,
    trend,
    delta,
  };
};

export function demoGetClientLabSummary(
  clientId: string
): LabSummaryItemDto[] {
  const labs = demoGetClientLabs(clientId);
  const markers = Array.from(new Set(labs.map((lab) => lab.marker)));
  return markers
    .map((marker) => buildSummaryItem(marker, labs))
    .filter((item): item is LabSummaryItemDto => Boolean(item));
}

export function shouldUseDemoFallback(error?: unknown): boolean {
  if (!isDemoModeEnabled()) return false;
  if (!error) return true;
  const status =
    (error as any)?.response?.status ??
    (error as any)?.status ??
    (error as any)?.code;
  if (typeof status === 'number') {
    return status === 404 || status === 405 || status >= 500;
  }
  return true;
}
