// src/hooks/useBTCHistory.ts
// Enhanced hook for fetching BTC price history data with better error handling

import useSWR from 'swr';
import { fetcher } from '../lib/fetchers';

interface PricePoint {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

interface BTCHistoryData {
  prices: PricePoint[];
  source: string;
  interval: string;
  count: number;
  isLimitedData?: boolean;
  range?: {
    start: string;
    end: string;
  };
  note?: string;
}

interface UseBTCHistoryReturn {
  data: BTCHistoryData | undefined;
  error: any;
  isLoading: boolean;
  isError: boolean;
  isLimitedData: boolean;
  dataRange: { start: Date; end: Date } | null;
}

export function useBTCHistory(minDate?: string): UseBTCHistoryReturn {
  // Build URL with optional minDate parameter
  const url = minDate 
    ? `/api/btcHistory?from=${minDate}`
    : '/api/btcHistory';

  const { data, error, isLoading, mutate } = useSWR<BTCHistoryData>(
    url,
    fetcher,
    {
      refreshInterval: 3600000, // Refresh every hour
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 300000, // Dedupe requests for 5 minutes
      shouldRetryOnError: true,
      errorRetryCount: 3,
      errorRetryInterval: 5000,
      onError: (err) => {
        console.error('Failed to fetch BTC history:', err);
      },
      onSuccess: (data) => {
        // Log successful fetch details
        if (data?.prices?.length > 0) {
          console.log(`BTC history loaded: ${data.count} candles from ${data.source}`);
          if (data.range) {
            console.log(`Data range: ${data.range.start} to ${data.range.end}`);
          }
          if (data.isLimitedData) {
            console.log('Note: Using limited data range');
          }
          if (minDate) {
            console.log(`Data filtered from: ${minDate}`);
          }
        }
      }
    }
  );

  // Determine if we're using limited data
  // Check both the explicit isLimitedData flag and fallback indicators
  const isLimitedData = data?.isLimitedData === true ||
                       data?.source === 'coingecko_fallback' || 
                       (data?.note?.includes('Limited') ?? false);

  // Calculate the actual data range
  const dataRange = data?.prices?.length > 0 
    ? {
        start: new Date(Math.min(...data.prices.map(p => p.time))),
        end: new Date(Math.max(...data.prices.map(p => p.time)))
      }
    : null;

  return { 
    data, 
    error, 
    isLoading,
    isError: !!error,
    isLimitedData,
    dataRange
  };
}

// Helper hook for manually refreshing the data
export function useBTCHistoryRefresh(minDate?: string) {
  // Build URL with optional minDate parameter
  const url = minDate 
    ? `/api/btcHistory?from=${minDate}`
    : '/api/btcHistory';
    
  const { mutate } = useSWR<BTCHistoryData>(url);
  
  const refresh = async () => {
    try {
      await mutate();
    } catch (err) {
      console.error('Failed to refresh BTC history:', err);
    }
  };

  return refresh;
}