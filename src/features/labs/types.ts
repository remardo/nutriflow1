
export type LabMarkerStatus = 'low' | 'ok' | 'high';

export type LabMarkerDefinition = {
  code: string;
  name: string;
  unit: string;
  refLow?: number;
  refHigh?: number;
  note?: string;
};

export type LabResultPoint = {
  id: string;
  clientId: string;
  markerCode: string;
  value: number;
  unit: string;
  date: string; // ISO yyyy-mm-dd
};

export type LabMarkerWithHistory = {
  definition: LabMarkerDefinition;
  history: LabResultPoint[];
};

export type ClientLabSummary = {
  clientId: string;
  markers: LabMarkerWithHistory[];
};

export const LAB_MARKERS: LabMarkerDefinition[] = [
  {
    code: 'FERRITIN',
    name: 'Ферритин',
    unit: 'нг/мл',
    refLow: 30,
    refHigh: 150,
    note: 'Ключевой показатель запасов железа.',
  },
  {
    code: 'VITD',
    name: 'Витамин D (25(OH)D)',
    unit: 'нг/мл',
    refLow: 30,
    refHigh: 60,
    note: 'Дефицит связан с иммунитетом и состоянием костей.',
  },
  {
    code: 'HB',
    name: 'Гемоглобин',
    unit: 'г/л',
    refLow: 120,
    refHigh: 150,
    note: 'Совместно с ферритином оценивается анемия.',
  },
];

export const LAB_CLIENTS = [
  { id: 'c1', name: 'Анна Петрова' },
  { id: 'c2', name: 'Игорь Смирнов' },
  { id: 'c3', name: 'Мария Лебедева' },
];

export const initialLabResults: LabResultPoint[] = [
  {
    id: 'r1',
    clientId: 'c1',
    markerCode: 'FERRITIN',
    value: 18,
    unit: 'нг/мл',
    date: '2025-08-01',
  },
  {
    id: 'r2',
    clientId: 'c1',
    markerCode: 'FERRITIN',
    value: 26,
    unit: 'нг/мл',
    date: '2025-09-01',
  },
  {
    id: 'r3',
    clientId: 'c1',
    markerCode: 'VITD',
    value: 22,
    unit: 'нг/мл',
    date: '2025-08-01',
  },
  {
    id: 'r4',
    clientId: 'c1',
    markerCode: 'VITD',
    value: 34,
    unit: 'нг/мл',
    date: '2025-09-01',
  },
  {
    id: 'r5',
    clientId: 'c2',
    markerCode: 'VITD',
    value: 32,
    unit: 'нг/мл',
    date: '2025-08-10',
  },
  {
    id: 'r6',
    clientId: 'c2',
    markerCode: 'HB',
    value: 152,
    unit: 'г/л',
    date: '2025-08-10',
  },
  {
    id: 'r7',
    clientId: 'c3',
    markerCode: 'FERRITIN',
    value: 46,
    unit: 'нг/мл',
    date: '2025-07-20',
  },
  {
    id: 'r8',
    clientId: 'c3',
    markerCode: 'VITD',
    value: 40,
    unit: 'нг/мл',
    date: '2025-07-20',
  },
];

export const classifyLabStatus = (
  marker: LabMarkerDefinition,
  value: number
): LabMarkerStatus => {
  if (marker.refLow == null || marker.refHigh == null) return 'ok';
  if (value < marker.refLow) return 'low';
  if (value > marker.refHigh) return 'high';
  return 'ok';
};

export const formatDate = (iso: string): string => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
  });
};
