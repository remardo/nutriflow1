
import React from 'react';
import './LabMarkerCard.css';
import { Tag } from '../../components/Tag/Tag';
import {
  LabMarkerDefinition,
  LabResultPoint,
  classifyLabStatus,
  formatDate,
} from './types';

type LabMarkerCardProps = {
  marker: LabMarkerDefinition;
  results: LabResultPoint[];
};

export const LabMarkerCard: React.FC<LabMarkerCardProps> = ({
  marker,
  results,
}) => {
  const sorted = [...results].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  const last = sorted[sorted.length - 1];
  if (!last) return null;

  const status = classifyLabStatus(marker, last.value);
  const prev = sorted[sorted.length - 2];

  const trend: 'up' | 'down' | 'flat' | null = prev
    ? last.value > prev.value + 0.01
      ? 'up'
      : last.value < prev.value - 0.01
      ? 'down'
      : 'flat'
    : null;

  const statusLabel =
    status === 'ok'
      ? 'В пределах референса'
      : status === 'low'
      ? 'Ниже нормы'
      : 'Выше нормы';

  const statusColor =
    status === 'ok' ? 'green' : status === 'low' ? 'orange' : 'red';

  const trendLabel =
    trend === 'up'
      ? 'Рост'
      : trend === 'down'
      ? 'Снижение'
      : trend === 'flat'
      ? 'Стабильно'
      : '—';

  const trendIcon =
    trend === 'up' ? '↑' : trend === 'down' ? '↓' : trend === 'flat' ? '→' : '';

  return (
    <div className="LabMarkerCard">
      <div className="LabMarkerCard-header">
        <div className="LabMarkerCard-title">
          {marker.name}
          <span className="LabMarkerCard-unit">{marker.unit}</span>
        </div>
        <Tag label={statusLabel} color={statusColor} subtle={status === 'ok'} />
      </div>
      <div className="LabMarkerCard-lastRow">
        <div className="LabMarkerCard-lastValue">
          {last.value}
          <span>{marker.unit}</span>
        </div>
        <div className="LabMarkerCard-ref">
          Референс:{' '}
          {marker.refLow != null && marker.refHigh != null
            ? `${marker.refLow}–${marker.refHigh} ${marker.unit}`
            : 'задать в настройках'}
        </div>
        <div className="LabMarkerCard-meta">
          Обновлено {formatDate(last.date)}
        </div>
      </div>
      {sorted.length > 1 && (
        <div className="LabMarkerCard-trendRow">
          <div className="LabMarkerCard-trend">
            Динамика: {trendIcon} {trendLabel}
          </div>
          {prev && (
            <div className="LabMarkerCard-trendDelta">
              Было {prev.value} {marker.unit} ({formatDate(prev.date)})
            </div>
          )}
        </div>
      )}
      <div className="LabMarkerCard-chart">
        <div className="LabMarkerCard-chartLine">
          {sorted.map((point, idx) => {
            const level =
              marker.refLow != null && marker.refHigh != null
                ? Math.max(
                    0,
                    Math.min(
                      100,
                      ((point.value - marker.refLow) /
                        (marker.refHigh - marker.refLow || 1)) * 60 +
                        20
                    )
                  )
                : 50;
            return (
              <div
                key={point.id}
                className="LabMarkerCard-dotWrapper"
                style={{ left: `${(idx / Math.max(sorted.length - 1, 1)) * 100}%` }}
              >
                <div
                  className={
                    'LabMarkerCard-dot LabMarkerCard-dot--' +
                    classifyLabStatus(marker, point.value)
                  }
                  style={{ bottom: `${level}%` }}
                />
                <div className="LabMarkerCard-dotLabel">
                  {formatDate(point.date)}
                </div>
              </div>
            );
          })}
          {marker.refLow != null && marker.refHigh != null && (
            <>
              <div className="LabMarkerCard-refBand" />
              <div className="LabMarkerCard-refLine Low" />
              <div className="LabMarkerCard-refLine High" />
            </>
          )}
        </div>
      </div>
      {marker.note && (
        <div className="LabMarkerCard-note">
          {marker.note}
        </div>
      )}
    </div>
  );
};
