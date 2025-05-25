import type { VercelRequest, VercelResponse } from '@vercel/node';

// Constants
const COINBASE_APPLE_ID = 886427730; // number
const COINBASE_BUNDLE_ID = 'com.coinbase.app';
const PAGE_SIZE = 100;  // SearchApi fixed page length
const MAX_PAGES = 10;   // stops at rank 1000

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  const apiKey = process.env.SEARCHAPI_IO_KEY;
  
  if (!apiKey) {
    console.error("SearchApi.io API key (SEARCHAPI_IO_KEY) is not configured on the server.");
    return res.status(500).json({ error: "API key not configured." });
  }

  try {
    // FINANCE CATEGORY - This is working fine
    const financeChartsUrl = 
      `https://www.searchapi.io/api/v1/search?api_key=${apiKey}` +
      `&engine=apple_app_store_top_charts` +
      `&store=us` +
      `&category=finance_apps` +
      `&chart=top_free`;

    console.log("Fetching finance category top charts...");
    const financeResponse = await fetch(financeChartsUrl);
    
    if (!financeResponse.ok) {
      const errorText = await financeResponse.text();
      console.error(`Finance API error: ${financeResponse.status} ${errorText}`);
      return res.status(500).json({ error: `Finance API failed: ${financeResponse.status}` });
    }

    const financeData = await financeResponse.json();
    
    let financeRank: number | null = null;
    let overallRank: number | null = null;

    // Parse finance charts
    if (financeData.top_charts && Array.isArray(financeData.top_charts)) {
      console.log(`Found ${financeData.top_charts.length} apps in finance top charts`);
      
      for (let i = 0; i < financeData.top_charts.length; i++) {
        const app = financeData.top_charts[i];
        
        // Compare with proper type conversion
        if (String(app.id) === String(COINBASE_APPLE_ID) || 
            app.bundle_id === COINBASE_BUNDLE_ID ||
            (app.title ?? '').toLowerCase().includes('coinbase')) {
          financeRank = app.position ?? (i + 1);
          console.log(`Coinbase found in finance at #${financeRank}`);
          break;
        }
      }
    }

    // OVERALL RANKING - Paginated approach with correct page size
    console.log("Fetching overall top charts with pagination...");
    
    for (let page = 1; page <= MAX_PAGES; page++) {
      const overallChartsUrl = 
        `https://www.searchapi.io/api/v1/search?api_key=${apiKey}` +
        `&engine=apple_app_store_top_charts` +
        `&store=us` +
        `&chart=top_free` +
        `&page=${page}`; // No num parameter, no category

      const overallResponse = await fetch(overallChartsUrl);
      
      if (!overallResponse.ok) {
        console.error(`Overall page ${page} failed: ${overallResponse.status}`);
        break;
      }

      const overallData = await overallResponse.json();
      const apps = overallData.top_charts || [];
      
      console.log(`Fetched page ${page}, rows: ${apps.length}`);
      
      for (let i = 0; i < apps.length; i++) {
        const app = apps[i];
        
        // Proper type-safe comparison
        if (String(app.id) === String(COINBASE_APPLE_ID) ||
            app.bundle_id === COINBASE_BUNDLE_ID ||
            (app.title ?? '').toLowerCase().includes('coinbase')) {
          overallRank = (page - 1) * PAGE_SIZE + (app.position ?? (i + 1));
          console.log(`Coinbase found at #${overallRank}`);
          break;
        }
      }
      
      if (overallRank) break; // found it
      if (apps.length < PAGE_SIZE) break; // last page reached
    }

    // FALLBACK: Search for Coinbase directly if not found in top 1000
    if (!overallRank) {
      console.log("Coinbase not found in top 1000, using search fallback...");
      
      const searchUrl = 
        `https://www.searchapi.io/api/v1/search?api_key=${apiKey}` +
        `&engine=apple_app_store` +
        `&store=us` +
        `&term=coinbase` +
        `&num=10`;
      
      const searchResponse = await fetch(searchUrl);
      
      if (searchResponse.ok) {
        const searchData = await searchResponse.json();
        
        if (searchData.organic_results && Array.isArray(searchData.organic_results)) {
          for (const app of searchData.organic_results) {
            // Proper type conversion
            if (Number(app.product_id) === COINBASE_APPLE_ID || 
                app.bundle_id === COINBASE_BUNDLE_ID) {
              // Try different rank fields
              overallRank = app.rank_overall || app.rank || app.position || null;
              if (overallRank) {
                console.log(`Coinbase rank from search: ${overallRank}`);
              } else {
                console.log("No rank information in search results");
              }
              break;
            }
          }
        }
      }
    }

    console.log(`Final ranks - Finance: ${financeRank}, Overall: ${overallRank}`);
    
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate');
    return res.status(200).json({ 
      financeRank: financeRank,
      overallRank: overallRank 
    });

  } catch (err: any) {
    console.error("Error in /api/coinbaseRank handler:", err);
    return res.status(500).json({ error: err.message || "An internal server error occurred." });
  }
}