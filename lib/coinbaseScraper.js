// lib/coinbaseScraper.js

import store from 'app-store-scraper';

const COINBASE_APPLE_ID = 886427730;

// Simple cache to avoid hitting Apple too frequently
let scraperCache = {
  data: null,
  timestamp: null
};
const SCRAPER_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Main scraper function that finds Coinbase rankings
 * Note: app-store-scraper has a 100 app limit for overall rankings
 * @returns {Promise<{financeRank: number|null, overallRank: number|string|null}>}
 */
export async function scrapeCoinbaseRanks() {
  console.log('[Scraper] Starting Coinbase rank scraping...');

  // Check scraper cache first
  if (scraperCache.data && scraperCache.timestamp && 
      (Date.now() - scraperCache.timestamp < SCRAPER_CACHE_DURATION)) {
    console.log('[Scraper] Returning cached scraper data');
    return scraperCache.data;
  }

  let financeRank = null;
  let overallRank = null;

  try {
    // Step 1: Use app-store-scraper for Finance category (top 200)
    console.log('[Scraper] Fetching Finance category top 200...');
    try {
      const financeApps = await store.list({
        collection: store.collection.TOP_FREE_IOS,
        category: store.category.FINANCE,
        country: 'us',
        num: 200  // Max available through the API
      });

      console.log(`[Scraper] Retrieved ${financeApps.length} Finance apps`);
      
      for (let i = 0; i < financeApps.length; i++) {
        const app = financeApps[i];
        if (Number(app.id) === COINBASE_APPLE_ID || 
            (app.title || '').toLowerCase().includes('coinbase')) {
          financeRank = i + 1;
          console.log(`[Scraper] Found Coinbase in Finance at rank #${financeRank}`);
          console.log(`[Scraper] Matched app details:`, {
            title: app.title,
            id: app.id,
            idType: typeof app.id
          });
          break;
        }
      }
    } catch (err) {
      console.error('[Scraper] Error fetching Finance category:', err.message);
    }

    // Step 2: Use app-store-scraper for Overall top 200
    console.log('[Scraper] Fetching Overall top 200...');
    try {
      const overallApps = await store.list({
        collection: store.collection.TOP_FREE_IOS,
        country: 'us',
        num: 100  // Library limit for overall rankings
      });

      console.log(`[Scraper] Retrieved ${overallApps.length} Overall apps`);
      
      // Debug: Log first few apps
      if (overallApps.length > 0) {
        console.log('[Scraper] First 3 overall apps:', overallApps.slice(0, 3).map(app => ({
          title: app.title,
          id: app.id,
          bundleId: app.bundleId
        })));
      }
      
      let found = false;
      for (let i = 0; i < overallApps.length; i++) {
        const app = overallApps[i];
        if (Number(app.id) === COINBASE_APPLE_ID || 
            (app.title || '').toLowerCase().includes('coinbase')) {
          overallRank = i + 1;
          found = true;
          console.log(`[Scraper] Found Coinbase in Overall at rank #${overallRank}`);
          console.log(`[Scraper] Matched app details:`, {
            title: app.title,
            id: app.id,
            idType: typeof app.id
          });
          break;
        }
      }
      
      // If not found in the returned apps, it's beyond the available data
      // app-store-scraper can only fetch 100 apps max for overall rankings
      if (!found && overallApps.length >= 100) {
        overallRank = '100+';
        console.log('[Scraper] Coinbase not in top 100 overall apps (library limit)');
      }
    } catch (err) {
      console.error('[Scraper] Error fetching Overall top 200:', err.message);
    }

  } catch (err) {
    console.error('[Scraper] Unexpected error during scraping:', err);
  }

  const result = { financeRank, overallRank };
  
  // Cache the result
  scraperCache.data = result;
  scraperCache.timestamp = Date.now();
  
  console.log(`[Scraper] Final scraped ranks - Finance: ${financeRank}, Overall: ${overallRank}`);
  return result;
}