// src/lib/fetchers.ts
// SWR fetcher functions with proper named exports

// Type definition for Coinbase rank API response
export interface RankApiResponse {
  financeRank: number | null;
  overallRank: number | null;
  prevFinanceRank: number | null;
  prevOverallRank: number | null;
  deltaFinance: number | null;
  deltaOverall: number | null;
  source?: string;
  stale?: boolean;
}

// Type definitions for Coinbase rank data - extended to include all necessary fields
export interface RankData extends RankApiResponse {
  // Original fields (kept for backward compatibility)
  currentRank?: number;
  previousRank?: number;
  category?: string;
  appName?: string;
  lastUpdated?: string;
  trend?: 'improving' | 'declining' | 'stable';
  
  // Additional fields for SignalCard compatibility
  rank?: number | null;
  direction?: 'up' | 'down' | 'none';
  cached?: boolean;
}

// Legacy interface (kept for backward compatibility)
export interface CoinbaseRankPayload {
  financeRank: number;
  prevFinanceRank: number | null;
  direction: 'up' | 'down' | 'none';
  overallRank: number | null;
  prevOverallRank: number | null;
}

// Main fetcher for SWR
export const fetcher = async (url: string) => {
  const response = await fetch(url);
  
  if (!response.ok) {
    const error = new Error('An error occurred while fetching the data.');
    // Attach extra info to the error object
    (error as any).info = await response.json();
    (error as any).status = response.status;
    throw error;
  }
  
  return response.json();
};

// Specialized fetchers (all use the same logic for now)
export const coinbaseRankFetcher = fetcher;
export const btcIndicatorsFetcher = fetcher;
export const piCycleFetcher = fetcher;

// Alternative fetcher with auth headers if needed
export const fetcherWithAuth = async (url: string, token?: string) => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetch(url, { headers });
  
  if (!response.ok) {
    const error = new Error('An error occurred while fetching the data.');
    (error as any).info = await response.json();
    (error as any).status = response.status;
    throw error;
  }
  
  return response.json();
};

// Default export as well for flexibility
export default fetcher;
