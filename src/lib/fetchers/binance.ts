// src/lib/fetchers/binance.ts
import { Candle } from './types.js';

export async function fetchBinanceKlines(interval: string, limit: number = 200): Promise<Candle[]> {
  const url = `https://data-api.binance.vision/api/v3/klines?symbol=BTCUSDT&interval=${interval}&limit=${limit}`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Binance API error: ${response.status}`);
  }
  
  const klines = await response.json();
  
  // Kline format: [openTime, open, high, low, close, volume, closeTime, ...]
  return klines.map((k: any[]) => ({
    date: new Date(k[0]).toISOString().split('T')[0],
    open: parseFloat(k[1]),
    high: parseFloat(k[2]),
    low: parseFloat(k[3]),
    close: parseFloat(k[4]),
    volume: parseFloat(k[5])
  }));
}

export async function getWeeklyBTCFromBinance(): Promise<Candle[]> {
  return fetchBinanceKlines('1w', 250);
}

export async function getMonthlyBTCFromBinance(): Promise<Candle[]> {
  return fetchBinanceKlines('1M', 50);
}
