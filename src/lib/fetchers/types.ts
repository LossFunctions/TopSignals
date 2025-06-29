// src/lib/fetchers/types.ts
export interface Candle {
  date: string; // 'YYYY-MM-DD'
  close: number;
  open?: number;
  high?: number;
  low?: number;
  volume?: number;
}

export interface ApiResponse<T> {
  data: T;
  source: string;
  timestamp: number;
}
