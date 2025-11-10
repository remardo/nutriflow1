import { LabStatus } from '@prisma/client';

export function mapMarkerCode(raw: string): string {
  return (raw || '').trim().toUpperCase();
}

export function evaluateLabStatus(args: {
  markerCode: string;
  value: number;
  ref?: { low?: number | null; high?: number | null };
}): LabStatus {
  const { value, ref } = args;

  if (typeof value !== 'number' || Number.isNaN(value)) {
    throw new Error('Invalid lab value');
  }

  const low = ref?.low ?? null;
  const high = ref?.high ?? null;

  if (low != null && value < low) {
    return 'LOW';
  }

  if (high != null && value > high) {
    return 'HIGH';
  }

  return 'NORMAL';
}

const TREND_THRESHOLD_RATIO = 0.07; // 7% порог
const TREND_THRESHOLD_ABS = 0.5; // минимальный абсолютный сдвиг

export function calculateTrend(
  values: { takenAt: Date; value: number }[]
): 'up' | 'down' | 'stable' {
  if (!values || values.length < 2) {
    return 'stable';
  }

  const sorted = [...values].sort(
    (a, b) => a.takenAt.getTime() - b.takenAt.getTime()
  );

  const first = sorted[0];
  const last = sorted[sorted.length - 1];

  const delta = last.value - first.value;
  const absDelta = Math.abs(delta);

  const rel = first.value !== 0 ? absDelta / Math.abs(first.value) : Infinity;
  const significant =
    absDelta >= TREND_THRESHOLD_ABS || rel >= TREND_THRESHOLD_RATIO;

  if (!significant) {
    return 'stable';
  }

  if (delta > 0) {
    return 'up';
  }

  if (delta < 0) {
    return 'down';
  }

  return 'stable';
}