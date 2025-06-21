// src/lib/fetchers/cg.ts
import { Candle } from './types.js';

export async function fetchCG(path: string, qs: Record<string, string> = {}) {
  const baseUrl = process.env.CG_API_BASE ?? "https://api.coingecko.com/api/v3";
  const url = new URL(`${baseUrl}${path}`);
  Object.entries(qs).forEach(([k, v]) => url.searchParams.append(k, v));
  
  const headers: Record<string, string> = {};
  if (process.env.CG_DEMO_API_KEY) {
    headers["x-cg-demo-api-key"] = process.env.CG_DEMO_API_KEY;
  }
  
  const res = await fetch(url.toString(), { headers });
  if (!res.ok) throw new Error(`CoinGecko API error: ${res.status}`);
  return res.json();
}

export async function getDailyBTCFromCG(): Promise<Candle[]> {
  const data = await fetchCG('/coins/bitcoin/market_chart', {
    'vs_currency': 'usd',
    'days': 'max',
    'interval': 'daily'
  });
  
  // Convert CoinGecko format [[timestamp, price], ...] to Candle[]
  return data.prices.map(([timestamp, price]: [number, number]) => ({
    date: new Date(timestamp).toISOString().split('T')[0],
    close: price
  }));
}
