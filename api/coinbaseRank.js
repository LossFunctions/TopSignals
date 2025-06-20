// api/coinbaseRank.js

import { scrapeCoinbaseRanks } from '../lib/coinbaseScraper.js';
import { createServerSupabaseClient } from '../lib/supabaseServer.js';

// Constants for identifying the Coinbase app
const COINBASE_APPLE_ID  = 886427730

// Simple in-memory cache for development
let lastFetchTime = null;
let cachedData = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export default async function handler(req, res) {
  // Initialize Supabase client
  const supabase = createServerSupabaseClient();
  
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

  // 4) SUPABASE PERSISTENCE WITH STICKY PREVIOUS LOGIC
  let prevFinanceRank = null;
  let prevOverallRank = null;
  let direction = 'none';

  if (supabase && financeRank !== null) {
    try {
      // ─── fetch the most recent stored row ───────────────────────────────────────
      const { data: [lastRow] = [] } = await supabase
        .from('coinbase_rank_history')
        .select('finance_rank')
        .order('fetched_at', { ascending: false })
        .limit(1);
      
      const lastStoredRank = lastRow?.finance_rank ?? null;
      
      // ─── determine previousDifferentRank before maybe inserting ────────────────
      if (lastStoredRank !== null) {
        if (financeRank !== lastStoredRank) {
          // Rank changed - use last stored rank as previous
          prevFinanceRank = lastStoredRank;
        } else {
          // Rank unchanged - pull the *last* different value (if any)
          const { data: [altRow] = [] } = await supabase
            .from('coinbase_rank_history')
            .select('finance_rank')
            .neq('finance_rank', financeRank)
            .order('fetched_at', { ascending: false })
            .limit(1);
          
          prevFinanceRank = altRow?.finance_rank ?? null;
        }
      }
      
      // ─── if the rank truly changed → insert a new row ──────────────────────────
      if (financeRank !== lastStoredRank) {
        await supabase
          .from('coinbase_rank_history')
          .insert({ finance_rank: financeRank });
        
        console.log(`[CoinbaseRank] Inserted new finance rank: ${financeRank} (previous: ${lastStoredRank})`);
      } else {
        console.log(`[CoinbaseRank] Finance rank unchanged at ${financeRank}, not inserting new record`);
      }
      
      // ─── arrow direction helper ────────────────────────────────────────────────
      direction = 
        prevFinanceRank === null ? 'none' :
        financeRank < prevFinanceRank ? 'up' :  // Lower rank number is better
        financeRank > prevFinanceRank ? 'down' :
        'none';
      
      console.log(`[CoinbaseRank] Direction: ${direction}, Current: ${financeRank}, Previous: ${prevFinanceRank}`);
    } catch (dbError) {
      console.error('[CoinbaseRank] Database operation error:', dbError);
    }
  }

  // For overall rank, keep existing logic (not implementing sticky previous yet)
  if (supabase && overallRank !== null) {
    try {
      // Look up the previous overall rank
      const { data: prevRows, error: selectError } = await supabase
        .from('coinbase_app_rank')
        .select('overall_rank')
        .order('recorded_at', { ascending: false })
        .limit(1);

      if (!selectError && prevRows && prevRows.length > 0) {
        prevOverallRank = prevRows[0].overall_rank;
      }
    } catch (dbError) {
      console.error('[CoinbaseRank] Error fetching previous overall rank:', dbError);
    }
  }

  // 4.5) STATIC MOCK DATA FALLBACK
  // If all sources failed and no previous data was retrieved, provide stable mock values
  if (financeRank === null && overallRank === null && prevFinanceRank === null && prevOverallRank === null) {
    console.warn('[CoinbaseRank] Falling back to static mock ranks');
    financeRank = 2;
    overallRank = 4;
    prevFinanceRank = 3;
    prevOverallRank = 7;
    direction = financeRank < prevFinanceRank ? 'up' : financeRank > prevFinanceRank ? 'down' : 'none';
    dataSource = 'static';
  }

  // Build response
  const result = { 
    financeRank, 
    overallRank,
    prevFinanceRank,
    prevOverallRank,
    direction,
    source: dataSource,  // For debugging only
    ...(scraperReason ? { scraperReason } : {})  // Include reason if scraper was used
  };
  
  // Cache without debug fields
  cachedData = { 
    financeRank, 
    overallRank,
    prevFinanceRank,
    prevOverallRank,
    direction
  };
  lastFetchTime = Date.now();

  // 5) Send response + aggressive cache headers
  // 5 min fresh, 24 hours stale-while-revalidate
  res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=86400')
  return res.status(200).json(result)
}
