import type { VercelRequest, VercelResponse } from '@vercel/node';

// Constants
const COINBASE_APPLE_ID = 886427730;
const COINBASE_BUNDLE_ID = 'com.coinbase.app';

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  const apiKey = process.env.SEARCHAPI_IO_KEY;
  
  if (!apiKey) {
    console.error("SearchApi.io API key (SEARCHAPI_IO_KEY) is not configured on the server.");
    return res.status(500).json({ error: "API key not configured." });
  }

  try {
    let financeRank: number | null = null;
    let overallRank: number | null = null;

    // FINANCE CATEGORY - This works fine
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
    
    // Parse finance charts
    if (financeData.top_charts && Array.isArray(financeData.top_charts)) {
      console.log(`Found ${financeData.top_charts.length} apps in finance top charts`);
      
      for (let i = 0; i < financeData.top_charts.length; i++) {
        const app = financeData.top_charts[i];
        
        if (String(app.id) === String(COINBASE_APPLE_ID) || 
            app.bundle_id === COINBASE_BUNDLE_ID ||
            (app.title ?? '').toLowerCase().includes('coinbase')) {
          financeRank = app.position ?? (i + 1);
          console.log(`Coinbase found in finance at #${financeRank}`);
          break;
        }
      }
    }

    // OVERALL RANKING - Single top 100 request
    console.log("Fetching overall top 100 charts...");
    const overallChartsUrl = 
      `https://www.searchapi.io/api/v1/search?api_key=${apiKey}` +
      `&engine=apple_app_store_top_charts` +
      `&store=us` +
      `&chart=top_free`;

    const overallResponse = await fetch(overallChartsUrl);
    
    if (overallResponse.ok) {
      const overallData = await overallResponse.json();
      const apps = overallData.top_charts || [];
      
      console.log(`Overall top charts returned ${apps.length} apps`);
      
      // Check if Coinbase is in top 100
      for (let i = 0; i < apps.length; i++) {
        const app = apps[i];
        
        if (String(app.id) === String(COINBASE_APPLE_ID) ||
            app.bundle_id === COINBASE_BUNDLE_ID ||
            (app.title ?? '').toLowerCase().includes('coinbase')) {
          overallRank = app.position ?? (i + 1);
          console.log(`Coinbase found in overall top 100 at #${overallRank}`);
          break;
        }
      }
    }

    // SEARCH FALLBACK - Only use rank_overall or rank (NOT position)
    if (!overallRank) {
      console.log("Coinbase not in top 100, using search fallback...");
      
      const searchUrl = 
        `https://www.searchapi.io/api/v1/search?api_key=${apiKey}` +
        `&engine=apple_app_store` +
        `&store=us` +
        `&term=coinbase` +
        `&num=20`;
      
      const searchResponse = await fetch(searchUrl);
      
      if (searchResponse.ok) {
        const searchData = await searchResponse.json();
        console.log('Search fallback first result:', searchData.organic_results?.[0]);
        
        if (searchData.organic_results && Array.isArray(searchData.organic_results)) {
          for (const app of searchData.organic_results) {
            // Check if this is Coinbase
            if (Number(app.id) === COINBASE_APPLE_ID ||
                Number(app.product_id) === COINBASE_APPLE_ID ||
                app.bundle_id === COINBASE_BUNDLE_ID) {
              // IMPORTANT: Only use rank_overall or rank, NOT position
              // position is just the index in search results (1-20), not the chart rank
              overallRank = app.rank_overall || app.rank || null;
              
              if (overallRank) {
                console.log(`Coinbase found via search with rank: ${overallRank}`);
              } else {
                console.log('Search returned no rank fields - treating as >100');
              }
              break;
            }
          }
        }
      } else {
        console.error(`Search fallback failed: ${searchResponse.status}`);
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