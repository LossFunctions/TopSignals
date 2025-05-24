import type { VercelRequest, VercelResponse } from '@vercel/node';

const COINBASE_APPLE_ID = '886427730';

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  const apiKey = process.env.SEARCHAPI_IO_KEY;
  
  if (!apiKey) {
    console.error("SearchApi.io API key (SEARCHAPI_IO_KEY) is not configured on the server.");
    return res.status(500).json({ error: "API key not configured." });
  }

  try {
    // Fetch top charts for finance category - using charts endpoint
    const financeChartsUrl = 
      `https://www.searchapi.io/api/v1/search?api_key=${apiKey}&engine=apple_app_store` +
      `&store=us&category_id=6015&chart=topfreeapplications&num=200`;

    console.log("Fetching finance category top charts...");
    const financeResponse = await fetch(financeChartsUrl);
    const financeText = await financeResponse.text();
    
    if (!financeResponse.ok) {
      console.error(`Finance API error: ${financeResponse.status} ${financeText}`);
      return res.status(500).json({ error: `Finance API failed: ${financeResponse.status}` });
    }

    const financeData = JSON.parse(financeText);
    
    let financeRank: number | null = null;
    let overallRank: number | null = null;

    // Debug: Log the structure of the response
    console.log("Finance data keys:", Object.keys(financeData));
    
    // Check different possible response structures
    const financeApps = financeData.organic_results || financeData.results || financeData.apps || [];
    
    if (Array.isArray(financeApps) && financeApps.length > 0) {
      console.log(`Found ${financeApps.length} apps in finance category`);
      console.log("First app structure:", JSON.stringify(financeApps[0], null, 2));
      
      // Try to find Coinbase
      for (let i = 0; i < financeApps.length; i++) {
        const app = financeApps[i];
        // Check multiple possible ID fields
        const appId = app.product_id || app.id || app.app_id || app.bundle_id;
        const appTitle = app.title || app.name || '';
        
        if (appId === COINBASE_APPLE_ID || appTitle.toLowerCase().includes('coinbase')) {
          // Use position if available, otherwise use array index + 1
          financeRank = app.position || app.rank || (i + 1);
          console.log(`Coinbase found! ID: ${appId}, Title: ${appTitle}, Rank: ${financeRank}`);
          break;
        }
      }
      
      // If still not found, log some apps to debug
      if (financeRank === null) {
        console.log("Coinbase not found. Sample apps:");
        financeApps.slice(0, 5).forEach((app, i) => {
          console.log(`${i + 1}. ${app.title || app.name} (ID: ${app.product_id || app.id || app.app_id})`);
        });
      }
    } else {
      console.error("No apps found in finance response");
    }

    // Fetch overall top charts - no category restriction
    const overallChartsUrl = 
      `https://www.searchapi.io/api/v1/search?api_key=${apiKey}&engine=apple_app_store` +
      `&store=us&chart=topfreeapplications&num=200`;

    console.log("Fetching overall top charts...");
    const overallResponse = await fetch(overallChartsUrl);
    
    if (overallResponse.ok) {
      const overallData = await overallResponse.json();
      const overallApps = overallData.organic_results || overallData.results || overallData.apps || [];
      
      if (Array.isArray(overallApps) && overallApps.length > 0) {
        console.log(`Found ${overallApps.length} apps in overall charts`);
        
        for (let i = 0; i < overallApps.length; i++) {
          const app = overallApps[i];
          const appId = app.product_id || app.id || app.app_id || app.bundle_id;
          const appTitle = app.title || app.name || '';
          
          if (appId === COINBASE_APPLE_ID || appTitle.toLowerCase().includes('coinbase')) {
            overallRank = app.position || app.rank || (i + 1);
            console.log(`Coinbase found in overall! Rank: ${overallRank}`);
            break;
          }
        }
      }
    } else {
      console.error(`Overall API error: ${overallResponse.status}`);
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