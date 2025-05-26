// src/hooks/useBTCIndicators.ts
import useSWR from 'swr';

export type BTCIndicatorsPayload = {
  monthlyRsi: number | null;
  rsiDanger: boolean;
  weeklyEma50: number | null;
  weeklyEma200: number | null;
  currentPrice: number | null;
  breakEma50: boolean | null;
  breakEma200: boolean | null;
  lastUpdated: string; // ISO timestamp
  errors?: {
    rsi?: string;
    ema50?: string;
    ema200?: string;
    price?: string;
  };
};

const btcIndicatorsFetcher = async (url: string): Promise<BTCIndicatorsPayload> => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  }
  return res.json();
};

export function useBTCIndicators() {
  const { data, error, isLoading } = useSWR<BTCIndicatorsPayload>(
    '/api/btcIndicators',
    btcIndicatorsFetcher,
    { 
      refreshInterval: 14400000, // Refresh every 4 hours
      revalidateOnFocus: false,
    }
  );

  return {
    data,
    error,
    isLoading,
  };
}