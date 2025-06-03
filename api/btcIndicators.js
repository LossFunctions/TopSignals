// api/btcIndicators.js
import { formatISO, parseISO } from 'date-fns';

// Dynamic import for technicalindicators to handle potential CommonJS issues
async function getIndicators() {
  const { RSI, EMA } = await import('technicalindicators');
  return { RSI, EMA };
}

// Cache for performance
let cachedData = null;
let lastFetchTime = null;
const CACHE_DURATION = 12 * 60 * 60 * 1000; // 12 hours

// Inline Binance fetcher functions
async function fetchBinanceKlines(interval, limit = 200) {
  const url = `https://data-api.binance.vision/api/v3/klines?symbol=BTCUSDT&interval=${interval}&limit=${limit}`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Binance API error: ${response.status}`);
  }
  
  const klines = await response.json();
  
  // Kline format: [openTime, open, high, low, close, volume, closeTime, ...]
  return klines.map((k) => ({
    date: new Date(k[0]).toISOString().split('T')[0],
    open: parseFloat(k[1]),
    high: parseFloat(k[2]),
    low: parseFloat(k[3]),
    close: parseFloat(k[4]),
    volume: parseFloat(k[5])
  }));
}

async function getWeeklyBTC() {
  return fetchBinanceKlines('1w', 250);
}

async function getMonthlyBTC() {
  return fetchBinanceKlines('1M', 50);
}

// Inline CoinGecko fetcher function
async function fetchCG(path, qs = {}) {
  const baseUrl = process.env.CG_API_BASE ?? "https://api.coingecko.com/api/v3";
  const url = new URL(`${baseUrl}${path}`);
  Object.entries(qs).forEach(([k, v]) => url.searchParams.append(k, v));
  
  const headers = {};
  if (process.env.CG_DEMO_API_KEY) {
    headers["x-cg-demo-api-key"] = process.env.CG_DEMO_API_KEY;
  }
  
  const res = await fetch(url.toString(), { headers });
  if (!res.ok) throw new Error(`CoinGecko API error: ${res.status}`);
  return res.json();
}

async function getDailyBTCFromCG() {
  try {
    const data = await fetchCG('/coins/bitcoin/market_chart', {
      'vs_currency': 'usd',
      'days': 'max',
      'interval': 'daily'
    });
    
    // Convert CoinGecko format [[timestamp, price], ...] to Candle[]
    return data.prices.map(([timestamp, price]) => ({
      date: new Date(timestamp).toISOString().split('T')[0],
      close: price
    }));
  } catch (error) {
    console.error('CoinGecko fetch error:', error);
    throw error;
  }
}

// Main handler function
export default async function handler(req, res) {
  const forceRefresh = req.query.refresh === '1';
  
  // Check cache unless force refresh
  if (!forceRefresh && cachedData && lastFetchTime && (Date.now() - lastFetchTime < CACHE_DURATION)) {
    console.log('[BTCIndicators] Serving from cache');
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=7200');
    return res.status(200).json(cachedData);
  }

  try {
    const { RSI, EMA } = await getIndicators();
    
    // Get monthly data from Binance
    let monthly;
    try {
      monthly = await getMonthlyBTC();
    } catch (error) {
      console.warn('[BTCIndicators] Binance monthly fetch failed, trying CoinGecko');
      const daily = await getDailyBTCFromCG();
      
      // Convert daily to monthly
      const monthlyMap = new Map();
      for (const candle of daily) {
        const date = new Date(candle.date);
        const yearMonth = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
        
        // Keep the latest candle for each month
        monthlyMap.set(yearMonth, {
          date: `${yearMonth}-01`, // First day of month
          close: candle.close
        });
      }
      
      monthly = Array.from(monthlyMap.values()).sort((a, b) => a.date.localeCompare(b.date));
    }
    
    // Get weekly data from Binance
    const weekly = await getWeeklyBTC();
    
    // Calculate Monthly RSI
    const monthlyCloses = monthly.map(m => m.close);
    const rsiValues = RSI.calculate({ period: 14, values: monthlyCloses });
    
    // Pad RSI values to align with monthly data
    const paddedRSI = Array(monthlyCloses.length - rsiValues.length).fill(null).concat(rsiValues);
    const enriched = monthly.map((m, i) => ({ ...m, rsi: paddedRSI[i] }));
    
    // Current RSI
    const currentRsi = enriched[enriched.length - 1]?.rsi;
    
    // Determine status
    let status = 'Normal';
    let rsiDanger = false;
    if (currentRsi >= 80) {
      status = 'Extreme';
      rsiDanger = true;
    } else if (currentRsi >= 75) {
      status = 'Warning';
    }
    
    // Calculate cycle high (cycle started 2022-11-01)
    const cycleStart = parseISO("2022-11-01");
    const currentCycle = enriched.filter(m => parseISO(m.date) >= cycleStart && m.rsi !== null);
    
    let cycleHigh = null;
    let cycleHighIsCurrentMonth = false;
    
    if (currentCycle.length > 0) {
      const peak = currentCycle.reduce((hi, m) => (m.rsi > hi.rsi ? m : hi));
      cycleHigh = { 
        value: Number(peak.rsi.toFixed(2)), 
        date: peak.date 
      };
      
      // Check if peak is in current month
      const lastClosedMonth = enriched[enriched.length - 1].date;
      cycleHighIsCurrentMonth = peak.date === lastClosedMonth;
    }
    
    // Calculate Weekly EMAs
    const weeklyCloses = weekly.map(w => w.close);
    const currentPrice = weeklyCloses[weeklyCloses.length - 1];
    
    let weeklyEma50 = null;
    let weeklyEma200 = null;
    let breakEma50 = null;
    let breakEma200 = null;
    
    if (weeklyCloses.length >= 50) {
      const ema50Values = EMA.calculate({ period: 50, values: weeklyCloses });
      weeklyEma50 = ema50Values[ema50Values.length - 1];
      breakEma50 = currentPrice < weeklyEma50;
    }
    
    if (weeklyCloses.length >= 200) {
      const ema200Values = EMA.calculate({ period: 200, values: weeklyCloses });
      weeklyEma200 = ema200Values[ema200Values.length - 1];
      breakEma200 = currentPrice < weeklyEma200;
    }
    
    // Historical cycle highs
    const historicalCycleHighs = [
      { cycle: '2013', value: 91.2, date: '2013-11-01' },
      { cycle: '2017', value: 89.8, date: '2017-12-01' },
      { cycle: '2021', value: 87.6, date: '2021-10-01' }
    ];
    
    const result = {
      monthlyRsi: currentRsi,
      status,
      rsiDanger,
      weeklyEma50,
      weeklyEma200,
      currentPrice,
      breakEma50,
      breakEma200,
      cycleHigh,
      cycleHighIsCurrentMonth,
      historicalCycleHighs,
      lastUpdated: formatISO(new Date()),
      errors: {}
    };
    
    // Update cache
    cachedData = result;
    lastFetchTime = Date.now();
    
    console.log('[BTCIndicators] Data updated successfully');
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=7200');
    return res.status(200).json(result);
    
  } catch (error) {
    console.error('[BTCIndicators] Error:', error);
    return res.status(500).json({ 
      error: error.message,
      lastUpdated: formatISO(new Date())
    });
  }
}
