import type { VercelRequest, VercelResponse } from '@vercel/node';

const COINBASE_APPLE_ID = '886427730';

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  const apiKey = process.env.SEARCHAPI_IO_KEY;
  
  if (!apiKey) {
    console.error("SearchApi.io API key (SEARCHAPI_IO_KEY) is not configured on the server.");
    return res.status(500).json({ error: "API key not configured." });
  }

  try {
    // EXACTLY like the original working code - search for "finance" in finance category
    const financeUrl = 
      `https://www.searchapi.io/api/v1/search?api_key=${apiKey}&engine=apple_app_store` +
      `&store=us&term=finance&category_id=6015&sort_by=topfreeapplications&num=100`;

    console.log("Fetching finance category apps...");
    const financeResponse = await fetch(financeUrl);
    const financeText = await financeResponse.text();
    
    if (!financeResponse.ok) {
      console.error(`Finance API error: ${financeResponse.status} ${financeText}`);
      return res.status(500).json({ error: `Finance API failed: ${financeResponse.status}` });
    }

    const financeData = JSON.parse(financeText);
    
    let financeRank: number | null = null;
    let overallRank: number | null = null;

    // Find Coinbase in finance results - EXACTLY like original
    const financeApps = financeData.organic_results;
    if (financeApps && Array.isArray(financeApps)) {
      for (const app of financeApps) {
        if (app.product_id === COINBASE_APPLE_ID) {
          financeRank = app.position;
          console.log(`Coinbase found at finance position: ${financeRank}`);
          break;
        }
      }
    }

    // For overall, search without category restriction
    const overallUrl = 
      `https://www.searchapi.io/api/v1/search?api_key=${apiKey}&engine=apple_app_store` +
      `&store=us&term=apps&sort_by=topfreeapplications&num=200`;

    const overallResponse = await fetch(overallUrl);
    
    if (overallResponse.ok) {
      const overallData = await overallResponse.json();
      const overallApps = overallData.organic_results;
      
      if (overallApps && Array.isArray(overallApps)) {
        for (const app of overallApps) {
          if (app.product_id === COINBASE_APPLE_ID) {
            overallRank = app.position;
            console.log(`Coinbase found at overall position: ${overallRank}`);
            break;
          }
        }
      }
    }

    // If not found in results, log warning but still return nulls
    if (financeRank === null) {
      console.warn(`Coinbase not found in finance category results`);
    }
    if (overallRank === null) {
      console.warn(`Coinbase not found in overall results`);
    }

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