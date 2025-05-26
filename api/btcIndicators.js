// api/btcIndicators.js
import { RSI, EMA } from 'technicalindicators';

// Simple in-memory cache to prevent dev hot-reload spam
let lastFetchTime = null;
let cachedData = null;
const CACHE_DURATION = 60 * 1000; // 60 seconds

// Helper to fetch monthly candles from Binance mirror (no geo-blocking)
async function fetchBinanceMonthlyCloses() {
  try {
    // Use binance.vision mirror to avoid US geo-blocking (HTTP 451)
    const url = 'https://data-api.binance.vision/api/v3/klines?symbol=BTCUSDT&interval=1M&limit=20';
    console.log('[BTCIndicators] Fetching Binance monthly candles from mirror...');
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Binance API error: ${response.status}`);
    }
    
    const klines = await response.json();
    // Kline format: [openTime, open, high, low, close, volume, closeTime, ...]
    // We need the close price (index 4)
    const closes = klines.map(k => parseFloat(k[4]));
    console.log(`[BTCIndicators] Got ${closes.length} monthly closes from Binance`);
    
    return closes;
  } catch (err) {
    console.error('[BTCIndicators] Binance fetch error:', err);
    throw err;
  }
}

// Helper to fetch weekly candles from Binance mirror
async function fetchBinanceWeeklyCloses() {
  try {
    // Fetch enough weekly candles for EMA-200 calculation (need 200+ weeks)
    const url = 'https://data-api.binance.vision/api/v3/klines?symbol=BTCUSDT&interval=1w&limit=250';
    console.log('[BTCIndicators] Fetching Binance weekly candles from mirror...');
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Binance API error: ${response.status}`);
    }
    
    const klines = await response.json();
    const closes = klines.map(k => parseFloat(k[4]));
    console.log(`[BTCIndicators] Got ${closes.length} weekly closes from Binance`);
    
    return closes;
  } catch (err) {
    console.error('[BTCIndicators] Binance weekly fetch error:', err);
    throw err;
  }
}

export default async function handler(req, res) {
  // Check in-memory cache for development
  if (cachedData && lastFetchTime && (Date.now() - lastFetchTime < CACHE_DURATION)) {
    console.log('[BTCIndicators] Serving from memory cache');
    res.setHeader('Cache-Control', 'public, s-maxage=14400, stale-while-revalidate=86400');
    return res.status(200).json(cachedData);
  }

  const apiKey = process.env.TAAPI_SECRET;
  if (!apiKey) {
    console.error('[BTCIndicators] TAAPI_SECRET is not configured.');
    return res.status(500).json({ error: 'API key not configured.' });
  }

  // Result object - we'll populate what we can
  const result = {
    monthlyRsi: null,
    rsiDanger: false,
    weeklyEma50: null,
    weeklyEma200: null,
    currentPrice: null,
    breakEma50: null,
    breakEma200: null,
    lastUpdated: new Date().toISOString(),
    errors: {}
  };

  try {
    // --- 1. Calculate Monthly RSI locally using Binance mirror ---
    try {
      const monthlyCloses = await fetchBinanceMonthlyCloses();
      
      if (monthlyCloses.length >= 15) { // Need at least 14 + 1 for RSI calculation
        const rsiValues = RSI.calculate({
          values: monthlyCloses,
          period: 14
        });
        
        if (rsiValues.length > 0) {
          result.monthlyRsi = rsiValues[rsiValues.length - 1];
          result.rsiDanger = result.monthlyRsi >= 80;
          console.log(`[BTCIndicators] Monthly RSI calculated: ${result.monthlyRsi}`);
        }
      } else {
        result.errors.rsi = 'Not enough monthly data for RSI calculation';
      }
    } catch (err) {
      console.error('[BTCIndicators] RSI calculation error:', err);
      result.errors.rsi = err.message;
    }

    // --- 2. Calculate Weekly EMAs locally using Binance mirror ---
    try {
      const weeklyCloses = await fetchBinanceWeeklyCloses();
      
      // Get current price (last weekly close)
      result.currentPrice = weeklyCloses[weeklyCloses.length - 1];
      
      // Calculate EMA-50
      if (weeklyCloses.length >= 50) {
        const ema50Values = EMA.calculate({
          values: weeklyCloses,
          period: 50
        });
        
        if (ema50Values.length > 0) {
          result.weeklyEma50 = ema50Values[ema50Values.length - 1];
          result.breakEma50 = result.currentPrice < result.weeklyEma50;
          console.log(`[BTCIndicators] Weekly EMA-50 calculated: ${result.weeklyEma50}`);
        }
      } else {
        result.errors.ema50 = 'Not enough weekly data for EMA-50 calculation';
      }
      
      // Calculate EMA-200
      if (weeklyCloses.length >= 200) {
        const ema200Values = EMA.calculate({
          values: weeklyCloses,
          period: 200
        });
        
        if (ema200Values.length > 0) {
          result.weeklyEma200 = ema200Values[ema200Values.length - 1];
          result.breakEma200 = result.currentPrice < result.weeklyEma200;
          console.log(`[BTCIndicators] Weekly EMA-200 calculated: ${result.weeklyEma200}`);
        }
      } else {
        result.errors.ema200 = 'Not enough weekly data for EMA-200 calculation';
      }
      
    } catch (err) {
      console.error('[BTCIndicators] EMA calculation error:', err);
      result.errors.ema = err.message;
    }

    // --- 3. Optional: Get real-time price from TAAPI (might work better than weekly close) ---
    try {
      console.log('[BTCIndicators] Fetching current BTC price from TAAPI...');
      const baseUrl = 'https://api.taapi.io';
      const priceUrl = `${baseUrl}/price?secret=${apiKey}&exchange=binance&symbol=BTC/USDT`;
      const priceResponse = await fetch(priceUrl);
      
      if (priceResponse.ok) {
        const priceData = await priceResponse.json();
        const realtimePrice = priceData.value || null;
        
        // Use realtime price for EMA break calculations if available
        if (realtimePrice) {
          result.currentPrice = realtimePrice;
          if (result.weeklyEma50) {
            result.breakEma50 = realtimePrice < result.weeklyEma50;
          }
          if (result.weeklyEma200) {
            result.breakEma200 = realtimePrice < result.weeklyEma200;
          }
          console.log(`[BTCIndicators] Using realtime price: ${realtimePrice}`);
        }
      }
    } catch (err) {
      // Non-critical - we already have price from weekly close
      console.log('[BTCIndicators] Could not fetch realtime price, using weekly close');
    }

    console.log('[BTCIndicators] Final result:', {
      ...result,
      errors: Object.keys(result.errors).length > 0 ? result.errors : 'none'
    });

    // Update cache
    cachedData = result;
    lastFetchTime = Date.now();

    // --- Send response with aggressive cache headers ---
    // 4 hours fresh, 24 hours stale-while-revalidate
    res.setHeader(
      'Cache-Control',
      'public, s-maxage=14400, stale-while-revalidate=86400'
    );
    
    return res.status(200).json(result);

  } catch (err) {
    console.error('[BTCIndicators] Unexpected exception:', err);
    return res.status(500).json({ 
      error: err.message || 'internal server error',
      ...result // Still return partial data if available
    });
  }
}