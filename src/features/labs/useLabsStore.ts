
import React from 'react';
import { persistence } from '../../utils/persistence';
import {
  LAB_MARKERS,
  LAB_CLIENTS,
  initialLabResults,
  LabMarkerDefinition,
  LabResultPoint,
} from './types';

const STORAGE_KEY = 'labs:results:v1';

export type LabsState = {
  markers: LabMarkerDefinition[];
  clients: { id: string; name: string }[];
  results: LabResultPoint[];
  isLoaded: boolean;
};

type LabsContextType = LabsState & {
  addResult: (partial: Omit<LabResultPoint, 'id'>) => Promise<void>;
  wipeAll: () => Promise<void>;
};

const LabsContext = React.createContext<LabsContextType | undefined>(undefined);

export const LabsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, setState] = React.useState<LabsState>({
    markers: LAB_MARKERS,
    clients: LAB_CLIENTS,
    results: initialLabResults,
    isLoaded: false,
  });

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await persistence.getItem(STORAGE_KEY);
        if (!mounted) return;
        if (data) {
          const parsed = JSON.parse(data) as LabResultPoint[];
          setState((prev) => ({
            ...prev,
            results: parsed.length ? parsed : initialLabResults,
            isLoaded: true,
          }));
        } else {
          setState((prev) => ({
            ...prev,
            results: initialLabResults,
            isLoaded: true,
          }));
          await persistence.setItem(
            STORAGE_KEY,
            JSON.stringify(initialLabResults)
          );
        }
      } catch {
        setState((prev) => ({
          ...prev,
          results: initialLabResults,
          isLoaded: true,
        }));
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const persist = async (results: LabResultPoint[]) => {
    await persistence.setItem(STORAGE_KEY, JSON.stringify(results));
  };

  const addResult = async (partial: Omit<LabResultPoint, 'id'>) => {
    const id = `lab-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
    setState((prev) => {
      const next = { ...prev, results: [...prev.results, { ...partial, id }] };
      void persist(next.results);
      return next;
    });
  };

  const wipeAll = async () => {
    setState((prev) => {
      const next = { ...prev, results: initialLabResults };
      void persist(next.results);
      return next;
    });
  };

  const value: LabsContextType = {
    ...state,
    addResult,
    wipeAll,
  };

  return (
    <LabsContext.Provider value={value}>{children}</LabsContext.Provider>
  );
};

export const useLabs = (): LabsContextType => {
  const ctx = React.useContext(LabsContext);
  if (!ctx) {
    throw new Error('useLabs must be used within LabsProvider');
  }
  return ctx;
};
