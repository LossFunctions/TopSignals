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
  direction?: 'up' | 'down' | 'none';
  cached?: boolean;
}

// New interface specifically for the Coinbase rank API response
export interface CoinbaseRankPayload {
  financeRank: number;
  prevFinanceRank: number | null;
  direction: 'up' | 'down' | 'none';
  overallRank: number | null;
  prevOverallRank: number | null;
}

// Main fetcher for SWR with improved error handling
export const fetcher = async (url: string) => {
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      let errorInfo;
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      
      try {
        // Try to parse error response as JSON
        errorInfo = await response.json();
        if (errorInfo.message) {
          errorMessage = errorInfo.message;
        }
      } catch (parseError) {
        // If JSON parsing fails, try to get text content
        try {
          const textContent = await response.text();
          if (textContent) {
            errorMessage = textContent;
          }
        } catch (textError) {
          // If both JSON and text parsing fail, use the default message
          errorMessage = `Failed to fetch data: ${response.status} ${response.statusText}`;
        }
      }
      
      const error = new Error(errorMessage);
      (error as any).info = errorInfo;
      (error as any).status = response.status;
      throw error;
    }
    
    // Try to parse successful response as JSON
    try {
      return await response.json();
    } catch (parseError) {
      // If JSON parsing fails on a successful response, check if it's empty
      const textContent = await response.text();
      if (!textContent.trim()) {
        throw new Error('Server returned empty response');
      }
      throw new Error('Server returned invalid JSON response');
    }
  } catch (error) {
    // Handle network errors (like ECONNREFUSED)
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Unable to connect to server. Please ensure the API server is running.');
    }
    // Re-throw other errors as-is
    throw error;
  }
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
  
  try {
    const response = await fetch(url, { headers });
    
    if (!response.ok) {
      let errorInfo;
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      
      try {
        errorInfo = await response.json();
        if (errorInfo.message) {
          errorMessage = errorInfo.message;
        }
      } catch (parseError) {
        try {
          const textContent = await response.text();
          if (textContent) {
            errorMessage = textContent;
          }
        } catch (textError) {
          errorMessage = `Failed to fetch data: ${response.status} ${response.statusText}`;
        }
      }
      
      const error = new Error(errorMessage);
      (error as any).info = errorInfo;
      (error as any).status = response.status;
      throw error;
    }
    
    try {
      return await response.json();
    } catch (parseError) {
      const textContent = await response.text();
      if (!textContent.trim()) {
        throw new Error('Server returned empty response');
      }
      throw new Error('Server returned invalid JSON response');
    }
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Unable to connect to server. Please ensure the API server is running.');
    }
    throw error;
  }
};

// Default export as well for flexibility
export default fetcher;