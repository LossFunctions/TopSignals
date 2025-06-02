// src/lib/fetchers.ts
// SWR fetcher functions with proper named exports

// Type definitions for Coinbase rank data - extended to include all necessary fields
export interface RankData {
  // Original fields
  currentRank: number;
  previousRank?: number;
  category: string;
  appName: string;
  lastUpdated: string;
  trend?: 'improving' | 'declining' | 'stable';
  source?: string;
  
  // Additional fields for SignalCard compatibility
  rank: number | null;
  financeRank?: number | null;
  overallRank?: number | null;
  prevFinanceRank?: number | null;
  prevOverallRank?: number | null;
  cached?: boolean;
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