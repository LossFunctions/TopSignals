// api/coinbaseRank.js

import { scrapeCoinbaseRanks } from '../lib/coinbaseScraper.js';

// Constants for identifying the Coinbase app
const COINBASE_APPLE_ID  = 886427730

// Simple in-memory cache for development
let lastFetchTime = null;
let cachedData = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export default async function handler(req, res) {
  // Check if we have recent cached data (helps in dev with hot reloads)
  if (cachedData && lastFetchTime && (Date.now() - lastFetchTime < CACHE_DURATION)) {
    console.log('[CoinbaseRank] Serving from memory cache');
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=86400');
    return res.status(200).json(cachedData);
  }

  const apiKey = process.env.SEARCHAPI_IO_KEY
  let useScraperFallback = false;
  let scraperReason = '';

  if (!apiKey) {
    console.error('SearchApi.io API key (SEARCHAPI_IO_KEY) is not configured.')
    console.log('[CoinbaseRank] No API key, falling back to scraper');
    useScraperFallback = true;
    scraperReason = 'no_api_key';
  }

  let financeRank = null;
  let overallRank = null;
  let dataSource = 'searchapi';

  if (!useScraperFallback) {
    try {
      // 1) FINANCE CATEGORY TOP-CHARTS
      const financeUrl =
        `https://www.searchapi.io/api/v1/search?api_key=${apiKey}` +
        `&engine=apple_app_store_top_charts` +
        `&store=us` +
        `&category=finance_apps` +
        `&chart=top_free`

      console.log('Fetching finance category top charts...')
      const financeResponse = await fetch(financeUrl)

      if (financeResponse.status === 429) {
        console.error('Finance API quota exceeded (429)')
        useScraperFallback = true;
        scraperReason = 'quota_exceeded';
      } else if (!financeResponse.ok) {
        const errTxt = await financeResponse.text().catch(() => '')
        console.error(`Finance API error: ${financeResponse.status}`, errTxt)
        useScraperFallback = true;
        scraperReason = `finance_api_error_${financeResponse.status}`;
      } else {
        const financeData = await financeResponse.json()
        if (Array.isArray(financeData.top_charts)) {
          console.log(`Found ${financeData.top_charts.length} apps in finance top charts`)
          for (let i = 0; i < financeData.top_charts.length; i++) {
            const app = financeData.top_charts[i]
            if (
              String(app.id) === String(COINBASE_APPLE_ID) ||
              (app.title || '').toLowerCase().includes('coinbase')
            ) {
              financeRank = app.position ?? i + 1
              console.log(`Coinbase found in finance at #${financeRank}`)
              break
            }
          }
        }
      }

      // 2) OVERALL TOP-100 CHARTS (only if finance succeeded)
      if (!useScraperFallback) {
        console.log('Fetching overall top 100 charts...')
        const overallUrl =
          `https://www.searchapi.io/api/v1/search?api_key=${apiKey}` +
          `&engine=apple_app_store_top_charts` +
          `&store=us` +
          `&chart=top_free`

        const overallResponse = await fetch(overallUrl)

        if (overallResponse.status === 429) {
          console.error('Overall API quota exceeded (429)')
          useScraperFallback = true;
          scraperReason = 'quota_exceeded';
        } else if (!overallResponse.ok) {
          const errTxt = await overallResponse.text().catch(() => '')
          console.error(`Overall API error: ${overallResponse.status}`, errTxt)
          useScraperFallback = true;
          scraperReason = `overall_api_error_${overallResponse.status}`;
        } else {
          const overallData = await overallResponse.json()
          const overallCharts = overallData.top_charts || []
          console.log(`Overall top charts returned ${overallCharts.length} apps`)

          for (let i = 0; i < overallCharts.length; i++) {
            const app = overallCharts[i]
            if (
              String(app.id) === String(COINBASE_APPLE_ID) ||
              (app.title || '').toLowerCase().includes('coinbase')
            ) {
              overallRank = app.position ?? i + 1
              console.log(`Coinbase found in overall top 100 at #${overallRank}`)
              break
            }
          }

          // If not found in top 100, we know it's beyond that
          if (!overallRank) {
            console.log('Coinbase not in top 100, will use scraper for more accurate data')
            useScraperFallback = true;
            scraperReason = 'coinbase_beyond_100';
          }
        }
      }

    } catch (err) {
      console.error('Error in SearchAPI flow:', err)
      useScraperFallback = true;
      scraperReason = 'searchapi_exception';
    }
  }

  // 3) SCRAPER FALLBACK
  if (useScraperFallback) {
    console.log(`[CoinbaseRank] Using scraper fallback (reason: ${scraperReason})`);
    try {
      const scrapedData = await scrapeCoinbaseRanks();
      
      // Merge scraped data with any partial data we may have
      if (scrapedData.financeRank !== null && financeRank === null) {
        financeRank = scrapedData.financeRank;
      }
      if (scrapedData.overallRank !== null && overallRank === null) {
        overallRank = scrapedData.overallRank;
      }
      
      dataSource = 'scraper';
      console.log(`[CoinbaseRank] Scraper returned - Finance: ${scrapedData.financeRank}, Overall: ${scrapedData.overallRank}`);
    } catch (scraperErr) {
      console.error('[CoinbaseRank] Scraper failed:', scraperErr);
      // If scraper fails and we have stale cache, use it
      if (cachedData) {
        console.log('[CoinbaseRank] Scraper failed, serving stale cache');
        res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=86400');
        return res.status(200).json({ ...cachedData, stale: true });
      }
    }
  }

  console.log(`[CoinbaseRank] Final ranks - Finance: ${financeRank}, Overall: ${overallRank}, Source: ${dataSource}`);

  // Store in cache
  const result = { 
    financeRank, 
    overallRank,
    source: dataSource,  // For debugging only
    ...(scraperReason ? { scraperReason } : {})  // Include reason if scraper was used
  };
  
  cachedData = { financeRank, overallRank }; // Cache without debug fields
  lastFetchTime = Date.now();

  // 4) Send response + aggressive cache headers
  // 5 min fresh, 24 hours stale-while-revalidate
  res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=86400')
  return res.status(200).json(result)
}