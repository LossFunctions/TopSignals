import useSWR from 'swr';

export type PiCyclePayload = {
  time: string;          // ISO
  sma111: number;
  sma350x2: number;
  crossed: boolean;
  distancePct: number;   // % difference (negative = below)
};

const piCycleFetcher = async (url: string): Promise<PiCyclePayload> => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  }
  return res.json();
};

export function usePiCycle() {
  const { data, error, isLoading } = useSWR<PiCyclePayload>(
    '/api/piCycle',
    piCycleFetcher,
    { 
      refreshInterval: 3600000, // Refresh every hour (1h)
      revalidateOnFocus: false,
    }
  );

  return {
    data,
    error,
    isLoading,
  };
}