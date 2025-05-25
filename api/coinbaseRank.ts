import type { VercelRequest, VercelResponse } from '@vercel/node';

// Use numbers, not strings!
const COINBASE_APPLE_ID = 886427730; // number
const COINBASE_BUNDLE_ID = 'com.coinbase.app';
const MAX_PAGES = 5; // Scan up to page 5 (positions 1-1000)

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
      `&chart=top_free` +
      `&num=200`;

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
        
        // Compare numbers properly!
        if (app.id === COINBASE_APPLE_ID || 
            app.bundle_id === COINBASE_BUNDLE_ID ||
            app.title?.toLowerCase().includes('coinbase')) {
          financeRank = app.position || (i + 1);
          console.log(`Coinbase found in finance! Position: ${financeRank}`);
          break;
        }
      }
    }

    // OVERALL RANKING - Paginated approach
    console.log("Fetching overall top charts with pagination...");
    
    for (let page = 1; page <= MAX_PAGES; page++) {
      const overallChartsUrl = 
        `https://www.searchapi.io/api/v1/search?api_key=${apiKey}` +
        `&engine=apple_app_store_top_charts` +
        `&store=us` +
        `&chart=top_free` +
        `&num=200` +
        `&page=${page}`; // Note: omitting category entirely for overall

      console.log(`Fetching overall page ${page}...`);
      const overallResponse = await fetch(overallChartsUrl);
      
      if (!overallResponse.ok) {
        console.error(`Overall page ${page} failed: ${overallResponse.status}`);
        break; // Stop pagination on error
      }

      const overallData = await overallResponse.json();
      
      if (overallData.top_charts && Array.isArray(overallData.top_charts)) {
        console.log(`Page ${page}: Found ${overallData.top_charts.length} apps`);
        
        for (let i = 0; i < overallData.top_charts.length; i++) {
          const app = overallData.top_charts[i];
          
          // Proper type comparison
          if (app.id === COINBASE_APPLE_ID || 
              app.bundle_id === COINBASE_BUNDLE_ID ||
              app.title?.toLowerCase().includes('coinbase')) {
            // Calculate actual position considering pagination
            const positionOnPage = app.position || (i + 1);
            overallRank = ((page - 1) * 200) + positionOnPage;
            console.log(`Coinbase found on page ${page}! Overall rank: ${overallRank}`);
            break;
          }
        }
        
        if (overallRank) break; // Found it, stop pagination
        
        // If we got fewer than 200 results, we've reached the end
        if (overallData.top_charts.length < 200) {
          console.log(`Reached end of results on page ${page}`);
          break;
        }
      }
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
            // Check both ID types
            const appId = typeof app.product_id === 'string' ? parseInt(app.product_id) : app.product_id;
            
            if (appId === COINBASE_APPLE_ID || app.bundle_id === COINBASE_BUNDLE_ID) {
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