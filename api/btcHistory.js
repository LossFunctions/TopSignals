// api/btcHistory.js
// BTC price history endpoint for the 4-Year Cycle chart
// Updated to use CryptoCompare for historical data

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  
  try {
    console.log('Starting BTC history fetch...');
    
    // STEP 1: Fetch all available Binance data
    const binancePrices = await fetchBinanceData();
    console.log(`Successfully fetched ${binancePrices.length} daily candles from Binance`);
    
    if (binancePrices.length > 0) {
      const earliestDate = new Date(binancePrices[0].time);
      const latestDate = new Date(binancePrices[binancePrices.length - 1].time);
      console.log(`Binance data range: ${earliestDate.toISOString()} to ${latestDate.toISOString()}`);
    }
    
    // STEP 2: Check if we need historical data before 2017
    const earliestBinanceTime = binancePrices.length > 0 ? binancePrices[0].time : Date.now();
    const needsHistoricalData = new Date(earliestBinanceTime) > new Date('2013-01-01');
    
    let finalPrices = binancePrices;
    let dataSources = ['binance'];
    let isLimitedData = true; // Default to limited unless we get historical data
    
    if (needsHistoricalData && binancePrices.length > 0) {
      console.log('Need pre-2017 data, fetching from CryptoCompare...');
      
      // STEP 3: Try CryptoCompare for historical data
      const historicalPrices = await fetchCryptoCompareHistorical(earliestBinanceTime);
      
      // STEP 4: Validate and merge if we got data
      if (historicalPrices.length > 0) {
        console.log(`CryptoCompare data: ${historicalPrices.length} rows (${new Date(historicalPrices[0].time).toISOString().split('T')[0]} → ${new Date(historicalPrices[historicalPrices.length - 1].time).toISOString().split('T')[0]})`);
        
        // Merge and deduplicate
        const allPrices = [...historicalPrices, ...binancePrices];
        
        // Use Map to ensure unique timestamps
        const uniquePricesMap = new Map();
        allPrices.forEach(price => {
          uniquePricesMap.set(price.time, price);
        });
        
        // Convert back to array and sort by time
        finalPrices = Array.from(uniquePricesMap.values())
          .sort((a, b) => a.time - b.time);
        
        dataSources.push('cryptocompare_historical');
        isLimitedData = false; // We have full data!
        
        console.log(`Merged dataset: ${finalPrices.length} rows ${new Date(finalPrices[0].time).toISOString().split('T')[0]} → ${new Date(finalPrices[finalPrices.length - 1].time).toISOString().split('T')[0]}`);
      } else {
        console.log('No historical data retrieved from CryptoCompare, using only Binance data');
      }
    }
    
    // Final validation and logging
    if (finalPrices.length > 0) {
      const startDate = new Date(finalPrices[0].time).toISOString();
      const endDate = new Date(finalPrices[finalPrices.length - 1].time).toISOString();
      console.log(`Final dataset: ${finalPrices.length} candles from ${startDate} to ${endDate}`);
    }
    
    // Cache for 24 hours (daily candles only change once per day)
    res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=3600');
    
    return res.status(200).json({ 
      prices: finalPrices,
      source: dataSources.join('+'),
      interval: 'daily',
      count: finalPrices.length,
      isLimitedData,
      range: finalPrices.length > 0 ? {
        start: new Date(finalPrices[0].time).toISOString(),
        end: new Date(finalPrices[finalPrices.length - 1].time).toISOString()
      } : null
    });
    
  } catch (error) {
    console.error('Primary flow error:', error);
    
    // Fallback to CoinGecko OHLC endpoint (365 days max on free tier)
    try {
      console.log('Falling back to CoinGecko OHLC API (limited to 365 days)...');
      
      const prices = await fetchCoinGeckoOHLC();
      
      console.log(`Fallback successful: ${prices.length} candles from CoinGecko`);
      
      // Cache for 5 minutes in fallback mode
      res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=60');
      
      return res.status(200).json({ 
        prices,
        source: 'coingecko_fallback',
        interval: 'varies',
        count: prices.length,
        isLimitedData: true,
        note: 'Limited to 365 days due to API fallback',
        range: prices.length > 0 ? {
          start: new Date(Math.min(...prices.map(p => p.time))).toISOString(),
          end: new Date(Math.max(...prices.map(p => p.time))).toISOString()
        } : null
      });
      
    } catch (fallbackError) {
      console.error('All data sources failed:', {
        primary: error.message,
        fallback: fallbackError.message
      });
      
      // Return 500 error so frontend knows something is wrong
      return res.status(500).json({ 
        error: 'Failed to fetch BTC price history from all sources',
        details: {
          primary: error.message,
          fallback: fallbackError.message
        },
        suggestion: 'The service may be temporarily unavailable. Please try again later.'
      });
    }
  }
}

// Helper function to fetch Binance data
async function fetchBinanceData() {
  const maxCandlesPerRequest = 1000;
  let allCandles = [];
  let currentEndTime = Date.now();
  let consecutiveEmptyResponses = 0;
  const maxRetries = 3;
  const seenTimestamps = new Set();
  
  while (consecutiveEmptyResponses < 2) {
    let retryCount = 0;
    let success = false;
    let candles = [];
    
    while (retryCount < maxRetries && !success) {
      try {
        const url = `https://data-api.binance.vision/api/v3/klines?symbol=BTCUSDT&interval=1d&endTime=${currentEndTime}&limit=${maxCandlesPerRequest}`;
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`Binance mirror API error: ${response.status}`);
        }
        
        candles = await response.json();
        success = true;
        
      } catch (fetchError) {
        retryCount++;
        console.error(`Binance request failed (attempt ${retryCount}/${maxRetries}):`, fetchError.message);
        
        if (retryCount < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 100 * Math.pow(2, retryCount - 1)));
        }
      }
    }
    
    if (!success) {
      console.error('Failed to fetch from Binance after all retries');
      break;
    }
    
    if (!candles || candles.length === 0) {
      consecutiveEmptyResponses++;
      console.log('Received empty response from Binance, may have reached data boundary');
      break;
    }
    
    consecutiveEmptyResponses = 0;
    
    const uniqueCandles = candles.filter(candle => {
      const timestamp = parseInt(candle[0]);
      if (seenTimestamps.has(timestamp)) {
        return false;
      }
      seenTimestamps.add(timestamp);
      return true;
    });
    
    allCandles = [...uniqueCandles, ...allCandles];
    
    console.log(`Fetched ${uniqueCandles.length} unique candles, total: ${allCandles.length}`);
    
    if (uniqueCandles.length > 0) {
      currentEndTime = parseInt(uniqueCandles[0][0]) - 1;
      const oldestDate = new Date(currentEndTime);
      
      if (oldestDate < new Date('2017-08-01')) {
        console.log('Reached Binance data boundary');
        break;
      }
    }
    
    await new Promise(resolve => setTimeout(resolve, 100));
    
    if (allCandles.length > 10000) {
      console.log('Sanity limit reached (10000 candles)');
      break;
    }
  }
  
  // Transform to our format
  return allCandles.map(candle => ({
    time: parseInt(candle[0]),
    open: parseFloat(candle[1]),
    high: parseFloat(candle[2]),
    low: parseFloat(candle[3]),
    close: parseFloat(candle[4]),
    volume: parseFloat(candle[5])
  }));
}

// Helper function to fetch CryptoCompare historical data
async function fetchCryptoCompareHistorical(earliestBinanceTime) {
  const apiKey = process.env.CRYPTO_COMPARE_API;
  
  if (!apiKey) {
    console.error('CRYPTO_COMPARE_API not found in environment variables');
    console.log('For local development, run: vercel env pull .env.local');
    return [];
  }
  
  const ONE_DAY = 86_400; // seconds
  const limit = 2000; // max candles per request (about 5.5 years)
  
  let endTs = Math.floor((earliestBinanceTime / 1000)) - ONE_DAY; // Convert to seconds
  const startCutoff = Math.floor(new Date('2010-07-17').getTime() / 1000);
  
  let allHistoricalPrices = [];
  let requestCount = 0;
  const maxRequests = 5; // Safety limit
  
  while (endTs > startCutoff && requestCount < maxRequests) {
    requestCount++;
    console.log(`Fetching CryptoCompare batch ${requestCount}, ending at ${new Date(endTs * 1000).toISOString().split('T')[0]}`);
    
    let retries = 0;
    const maxRetries = 2;
    let success = false;
    
    while (retries < maxRetries && !success) {
      try {
        const url = `https://min-api.cryptocompare.com/data/v2/histoday` +
                   `?fsym=BTC&tsym=USD&limit=${limit}&toTs=${endTs}&api_key=${apiKey}`;
        
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error(`CryptoCompare API error: ${response.status}`);
        }
        
        const result = await response.json();
        
        // Check response structure
        if (result.Response !== 'Success' || !result.Data?.Data || !Array.isArray(result.Data.Data)) {
          console.error('CryptoCompare returned invalid data structure:', result.Message || 'Unknown error');
          return allHistoricalPrices;
        }
        
        const data = result.Data.Data;
        
        if (data.length === 0) {
          console.log('No more historical data available');
          break;
        }
        
        // Transform data to our format
        const batchPrices = data
          .filter(d => d.time * 1000 < earliestBinanceTime) // Ensure we only get pre-Binance data
          .map(d => ({
            time: d.time * 1000, // Convert to milliseconds
            open: d.open,
            high: d.high,
            low: d.low,
            close: d.close,
            volume: d.volumeto || 0
          }));
        
        if (batchPrices.length > 0) {
          allHistoricalPrices = [...batchPrices, ...allHistoricalPrices];
          console.log(`Added ${batchPrices.length} prices from batch ${requestCount}, total: ${allHistoricalPrices.length}`);
          
          // Get the oldest timestamp from this batch for next request
          const oldestTimestamp = Math.min(...data.map(d => d.time));
          endTs = oldestTimestamp - ONE_DAY;
        } else {
          console.log('No relevant data in this batch');
          break;
        }
        
        success = true;
        
      } catch (error) {
        retries++;
        console.error(`CryptoCompare batch ${requestCount} attempt ${retries}/${maxRetries} failed:`, error.message);
        
        if (retries >= maxRetries) {
          console.error('Failed to fetch this batch after all retries');
          return allHistoricalPrices;
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    // Rate limit protection: 120 requests/min on free tier
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Remove duplicates and sort
  const uniquePricesMap = new Map();
  allHistoricalPrices.forEach(price => {
    uniquePricesMap.set(price.time, price);
  });
  
  const sortedPrices = Array.from(uniquePricesMap.values())
    .sort((a, b) => a.time - b.time);
  
  console.log(`CryptoCompare historical fetch complete: ${sortedPrices.length} unique prices across ${requestCount} batches`);
  
  return sortedPrices;
}

// Helper function for CoinGecko OHLC fallback
async function fetchCoinGeckoOHLC() {
  const apiKey = process.env.CG_DEMO_API_KEY;
  const days = 365;
  
  // Use query parameter for API key
  const url = `https://api.coingecko.com/api/v3/coins/bitcoin/ohlc?vs_currency=usd&days=${days}` +
              (apiKey ? `&x_cg_demo_api_key=${apiKey}` : '');
  
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept': 'application/json'
  };
  
  const response = await fetch(url, { headers });
  
  if (!response.ok) {
    throw new Error(`CoinGecko OHLC API error: ${response.status}`);
  }
  
  const data = await response.json();
  
  return data.map(([timestamp, open, high, low, close]) => ({
    time: timestamp,
    open,
    high,
    low,
    close,
    volume: 0
  }));
}