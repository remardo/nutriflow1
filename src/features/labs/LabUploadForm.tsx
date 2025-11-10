
import React from 'react';
import './LabUploadForm.css';
import { getClientLabMarkers, createClientLabsBatch } from '../../api/labs';

type LabUploadFormProps = {
  defaultClientId?: string | null;
};

export const LabUploadForm: React.FC<LabUploadFormProps> = ({
  defaultClientId,
}) => {
  const [clientId, setClientId] = React.useState(defaultClientId || '');
  const [markers, setMarkers] = React.useState<
    { marker: string; name?: string; unit?: string }[]
  >([]);
  const [markerCode, setMarkerCode] = React.useState('');
  const [value, setValue] = React.useState('');
  const [date, setDate] = React.useState(() => {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  });
  const [unitOverride, setUnitOverride] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [hint, setHint] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!clientId) {
      setMarkers([]);
      setMarkerCode('');
      return;
    }
    let mounted = true;
    (async () => {
      try {
        const list = await getClientLabMarkers(clientId);
        if (!mounted) return;
        setMarkers(list);
        if (list.length > 0 && !markerCode) {
          setMarkerCode(list[0].marker);
        }
      } catch {
        if (!mounted) return;
        setMarkers([]);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [clientId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const num = parseFloat(value.replace(',', '.'));

    if (!clientId) {
      setError('Выберите или укажите ID клиента');
      return;
    }
    if (!markerCode.trim()) {
      setError('Укажите код маркера');
      return;
    }
    if (Number.isNaN(num)) {
      setError('Значение должно быть числом');
      return;
    }
    if (!date) {
      setError('Укажите дату анализа');
      return;
    }

    const markerDef = markers.find((m) => m.marker === markerCode);
    const unit = unitOverride || markerDef?.unit || '';

    setIsLoading(true);
    setHint(null);

    try {
      await createClientLabsBatch(clientId, [
        {
          markerCode,
          value: num,
          unit: unit || undefined,
          takenAt: new Date(date).toISOString(),
        },
      ]);
      setHint('Результат добавлен. Карта анализов обновлена.');
      setValue('');
      setTimeout(() => setHint(null), 2500);
    } catch (err: any) {
      setError(
        err?.response?.data?.error ||
          'Не удалось сохранить анализ. Проверьте данные и доступ.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form className="LabUploadForm" onSubmit={handleSubmit}>
      <div className="LabUploadForm-row">
        <input
          className="LabUploadForm-input"
          placeholder="ID клиента"
          value={clientId}
          onChange={(e) => setClientId(e.target.value)}
        />
        <select
          className="LabUploadForm-select"
          value={markerCode}
          onChange={(e) => setMarkerCode(e.target.value)}
        >
          {markers.length > 0 ? (
            markers.map((m) => (
              <option key={m.marker} value={m.marker}>
                {m.name || m.marker}
              </option>
            ))
          ) : (
            <option value="">Выберите или введите код маркера ниже</option>
          )}
        </select>
      </div>
      <div className="LabUploadForm-row">
        <input
          className="LabUploadForm-input"
          placeholder="Код маркера (если не выбран из списка)"
          value={markerCode}
          onChange={(e) => setMarkerCode(e.target.value.toUpperCase())}
        />
        <input
          className="LabUploadForm-input"
          placeholder="Значение"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        <input
          className="LabUploadForm-input"
          placeholder="Ед. измерения (опционально)"
          value={unitOverride}
          onChange={(e) => setUnitOverride(e.target.value)}
        />
        <input
          className="LabUploadForm-input"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        <button
          className="LabUploadForm-btn"
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? 'Сохранение...' : '+ Добавить'}
        </button>
      </div>
      <div className="LabUploadForm-hint">
        {error
          ? error
          : hint ||
            'Можно заносить результаты через batch-эндпоинт /labs/batch. Укажите ID клиента и код маркера (например, FERRITIN).'}
      </div>
    </form>
  );
};
