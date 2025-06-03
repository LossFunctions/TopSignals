// src/hooks/useBTCIndicators.ts
import useSWR from 'swr';

// Historical cycle high RSI data
export interface CycleHighRsi {
  cycle: string;
  value: number;
  date: string;
}

// Current cycle high RSI data
export interface CurrentCycleHighRsi {
  value: number;
  date: string;
}

// Full API response payload
export type BTCIndicatorsPayload = {
  monthlyRsi: number | null;
  status: 'Normal' | 'Warning' | 'Extreme';
  rsiDanger: boolean;
  weeklyEma50: number | null;
  weeklyEma200: number | null;
  currentPrice: number | null;
  breakEma50: boolean | null;
  breakEma200: boolean | null;
  cycleHigh: CurrentCycleHighRsi | null;
  cycleHighIsCurrentMonth?: boolean; // NEW: indicates if the cycle high is from the current month
  historicalCycleHighs: CycleHighRsi[];
  lastUpdated: string; // ISO timestamp
  errors?: {
    rsi?: string;
    ema50?: string;
    ema200?: string;
    price?: string;
    historicalRsi?: string;
  };
};

// Specialized interface for the Monthly RSI Card
export interface MonthlyRsiData {
  currentRsi: number;
  status: 'Normal' | 'Warning' | 'Extreme';
  cycleHigh: { value: number; date: string };
  cycleHighIsCurrentMonth?: boolean; // NEW: indicates if the cycle high is from the current month
  historicalCycleHighs: {
    cycle: string;
    value: number;
    date: string;
  }[];
  lastUpdated: string;
}

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
