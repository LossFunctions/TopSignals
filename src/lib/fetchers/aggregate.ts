// src/lib/fetchers/aggregate.ts
import { Candle } from './types.js';
import { getDailyBTCFromCG } from './cg.js';
import { getMonthlyBTCFromBinance, getWeeklyBTCFromBinance } from './binance.js';

// Get daily BTC data with fallback logic
export async function getDailyBTC(): Promise<Candle[]> {
  try {
    // Try CoinGecko first for historical daily data
    return await getDailyBTCFromCG();
  } catch (error) {
    console.error('CoinGecko failed, no fallback for daily data:', error);
    throw error;
  }
}

// Convert daily data to monthly (last day of each month)
export async function toMonthly(daily: Candle[]): Promise<Candle[]> {
  const monthlyMap = new Map<string, Candle>();
  
  for (const candle of daily) {
    const date = new Date(candle.date);
    const yearMonth = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
    
    // Keep the latest candle for each month (last day's close becomes month close)
    const monthlyDate = `${yearMonth}-01`;
    monthlyMap.set(yearMonth, {
      date: monthlyDate,
      close: candle.close,
      open: monthlyMap.get(yearMonth)?.open ?? candle.close,
      high: Math.max(monthlyMap.get(yearMonth)?.high ?? candle.close, candle.close),
      low: Math.min(monthlyMap.get(yearMonth)?.low ?? candle.close, candle.close)
    });
  }
  
  return Array.from(monthlyMap.values()).sort((a, b) => a.date.localeCompare(b.date));
}

// Get weekly data directly from Binance
export async function getWeeklyBTC(): Promise<Candle[]> {
  return getWeeklyBTCFromBinance();
}

// Get monthly data - try Binance first, fallback to aggregated daily
export async function getMonthlyBTC(): Promise<Candle[]> {
  try {
    return await getMonthlyBTCFromBinance();
  } catch (error) {
    console.warn('Binance monthly failed, using aggregated daily:', error);
    const daily = await getDailyBTC();
    return toMonthly(daily);
  }
}
