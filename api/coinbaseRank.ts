import type { VercelRequest, VercelResponse } from '@vercel/node';

const COINBASE_APPLE_ID = '886427730';
const COINBASE_BUNDLE_ID = 'com.coinbase.app';

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  const apiKey = process.env.SEARCHAPI_IO_KEY;
  
  if (!apiKey) {
    console.error("SearchApi.io API key (SEARCHAPI_IO_KEY) is not configured on the server.");
    return res.status(500).json({ error: "API key not configured." });
  }

  try {
    // CORRECT ENDPOINT: apple_app_store_top_charts for Finance category
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

    // Parse the top_charts array (not organic_results!)
    if (financeData.top_charts && Array.isArray(financeData.top_charts)) {
      console.log(`Found ${financeData.top_charts.length} apps in finance top charts`);
      
      for (let i = 0; i < financeData.top_charts.length; i++) {
        const app = financeData.top_charts[i];
        
        // Check both ID and bundle_id
        if (app.id === COINBASE_APPLE_ID || 
            app.bundle_id === COINBASE_BUNDLE_ID ||
            app.title?.toLowerCase().includes('coinbase')) {
          // Position is 1-indexed in the response
          financeRank = app.position || (i + 1);
          console.log(`Coinbase found in finance! Position: ${financeRank}, Title: ${app.title}`);
          break;
        }
      }
      
      if (!financeRank) {
        console.log("Coinbase not found in finance top 200. Sample apps:");
        financeData.top_charts.slice(0, 5).forEach((app: any) => {
          console.log(`- ${app.position}. ${app.title} (ID: ${app.id})`);
        });
      }
    } else {
      console.error("No top_charts array in finance response");
    }

    // CORRECT ENDPOINT: apple_app_store_top_charts for Overall (all categories)
    // Try to get up to 500 apps to find Coinbase
    const overallChartsUrl = 
      `https://www.searchapi.io/api/v1/search?api_key=${apiKey}` +
      `&engine=apple_app_store_top_charts` +
      `&store=us` +
      `&category=all_apps` +
      `&chart=top_free` +
      `&num=500`; // Increased from 200 to 500

    console.log("Fetching overall top charts (up to 500 apps)...");
    const overallResponse = await fetch(overallChartsUrl);
    
    if (overallResponse.ok) {
      const overallData = await overallResponse.json();
      
      if (overallData.top_charts && Array.isArray(overallData.top_charts)) {
        console.log(`Found ${overallData.top_charts.length} apps in overall top charts`);
        
        for (let i = 0; i < overallData.top_charts.length; i++) {
          const app = overallData.top_charts[i];
          
          if (app.id === COINBASE_APPLE_ID || 
              app.bundle_id === COINBASE_BUNDLE_ID ||
              app.title?.toLowerCase().includes('coinbase')) {
            overallRank = app.position || (i + 1);
            console.log(`Coinbase found in overall! Position: ${overallRank}`);
            break;
          }
        }
        
        if (!overallRank) {
          console.log("Coinbase not found in overall top 200, searching specifically...");
          
          // Fallback: Search for Coinbase specifically to get its rank
          const coinbaseSearchUrl = 
            `https://www.searchapi.io/api/v1/search?api_key=${apiKey}` +
            `&engine=apple_app_store` +
            `&store=us` +
            `&term=coinbase` +
            `&num=10`;
          
          const searchResponse = await fetch(coinbaseSearchUrl);
          
          if (searchResponse.ok) {
            const searchData = await searchResponse.json();
            
            if (searchData.organic_results && Array.isArray(searchData.organic_results)) {
              for (const app of searchData.organic_results) {
                if (app.product_id === COINBASE_APPLE_ID || 
                    app.bundle_id === COINBASE_BUNDLE_ID) {
                  // Check if the app has a rank field
                  if (app.rank) {
                    overallRank = app.rank;
                    console.log(`Coinbase overall rank from search: ${overallRank}`);
                  } else if (app.position) {
                    // Some responses might use position instead of rank
                    overallRank = app.position;
                    console.log(`Coinbase overall position from search: ${overallRank}`);
                  } else {
                    // If no rank info, we can't determine it
                    console.log("No rank information available in search results");
                    console.log("App data:", JSON.stringify(app, null, 2));
                  }
                  break;
                }
              }
            }
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