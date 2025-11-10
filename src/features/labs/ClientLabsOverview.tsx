
import React from 'react';
import './ClientLabsOverview.css';
import { useLabs } from './useLabsStore';
import {
  classifyLabStatus,
  LAB_MARKERS,
  LAB_CLIENTS,
  LabMarkerDefinition,
} from './types';
import { Tag } from '../../components/Tag/Tag';

type ClientLabsOverviewProps = {
  focusClientId?: string | null;
  onSelectClient?: (id: string) => void;
};

export const ClientLabsOverview: React.FC<ClientLabsOverviewProps> = ({
  focusClientId,
  onSelectClient,
}) => {
  const { results } = useLabs();
  const [selectedClientId, setSelectedClientId] = React.useState<string>(
    focusClientId || LAB_CLIENTS[0]?.id || ''
  );

  React.useEffect(() => {
    if (focusClientId) setSelectedClientId(focusClientId);
  }, [focusClientId]);

  const client = LAB_CLIENTS.find((c) => c.id === selectedClientId);
  const clientResults = results.filter((r) => r.clientId === selectedClientId);

  type Group = {
    marker: LabMarkerDefinition;
    lastStatus: 'low' | 'ok' | 'high';
    lastValue: number | null;
  };

  const groups: Group[] = LAB_MARKERS.map((marker) => {
    const markerResults = clientResults
      .filter((r) => r.markerCode === marker.code)
      .sort(
        (a, b) =>
          new Date(a.date).getTime() - new Date(b.date).getTime()
      );
    const last = markerResults[markerResults.length - 1];
    return {
      marker,
      lastValue: last?.value ?? null,
      lastStatus: last
        ? classifyLabStatus(marker, last.value)
        : 'ok',
    };
  });

  const low = groups.filter((g) => g.lastStatus === 'low').length;
  const high = groups.filter((g) => g.lastStatus === 'high').length;
  const ok = groups.filter((g) => g.lastValue !== null && g.lastStatus === 'ok')
    .length;

  const handleClientChange = (id: string) => {
    setSelectedClientId(id);
    if (onSelectClient) onSelectClient(id);
  };

  return (
    <div className="ClientLabsOverview">
      <div className="ClientLabsOverview-header">
        <div className="ClientLabsOverview-title">
          Карта анализов клиента
        </div>
        <select
          className="ClientLabsOverview-select"
          value={selectedClientId}
          onChange={(e) => handleClientChange(e.target.value)}
        >
          {LAB_CLIENTS.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      {client ? (
        <>
          <div className="ClientLabsOverview-kpiRow">
            <div className="ClientLabsOverview-kpi">
              <span>{ok}</span>
              <label>в норме</label>
            </div>
            <div className="ClientLabsOverview-kpi warn">
              <span>{low}</span>
              <label>ниже нормы</label>
            </div>
            <div className="ClientLabsOverview-kpi high">
              <span>{high}</span>
              <label>выше нормы</label>
            </div>
          </div>
          <div className="ClientLabsOverview-grid">
            {groups.map((g) =>
              g.lastValue === null ? (
                <div
                  key={g.marker.code}
                  className="ClientLabsOverview-slot ClientLabsOverview-slot--empty"
                >
                  <div className="ClientLabsOverview-slot-title">
                    {g.marker.name}
                  </div>
                  <div className="ClientLabsOverview-slot-sub">
                    Нет данных — загрузите первый результат.
                  </div>
                </div>
              ) : (
                <div
                  key={g.marker.code}
                  className={
                    'ClientLabsOverview-slot ClientLabsOverview-slot--' +
                    g.lastStatus
                  }
                >
                  <div className="ClientLabsOverview-slot-title">
                    {g.marker.name}
                  </div>
                  <div className="ClientLabsOverview-slot-value">
                    {g.lastValue} {g.marker.unit}
                  </div>
                  <div className="ClientLabsOverview-slot-sub">
                    {g.marker.refLow != null && g.marker.refHigh != null
                      ? `Реф: ${g.marker.refLow}–${g.marker.refHigh} ${g.marker.unit}`
                      : 'Референс не указан'}
                  </div>
                </div>
              )
            )}
          </div>
          <div className="ClientLabsOverview-note">
            <Tag
              label="Карта анализов синхронизирована с профилем клиента и событиями"
              color="blue"
              subtle
            />
          </div>
        </>
      ) : (
        <div className="ClientLabsOverview-empty">
          Клиент не найден.
        </div>
      )}
    </div>
  );
};
