import type { VercelRequest, VercelResponse } from '@vercel/node';

const COINBASE_APPLE_ID = '886427730';

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  const apiKey = process.env.SEARCHAPI_IO_KEY;
  
  if (!apiKey) {
    console.error("SearchApi.io API key (SEARCHAPI_IO_KEY) is not configured on the server.");
    return res.status(500).json({ error: "API key not configured." });
  }

  try {
    // Fetch top 200 finance apps - NO search term, just category listing
    const financeUrl = 
      `https://www.searchapi.io/api/v1/search?api_key=${apiKey}&engine=apple_app_store` +
      `&store=us&category_id=6015&sort_by=topfreeapplications&num=200`;

    console.log("Fetching finance rankings...");
    const financeResponse = await fetch(financeUrl);
    
    if (!financeResponse.ok) {
      throw new Error(`Finance API error: ${financeResponse.status} ${financeResponse.statusText}`);
    }

    const financeData = await financeResponse.json();
    
    let financeRank: number | null = null;
    let overallRank: number | null = null;

    // Find Coinbase in finance results
    if (financeData.organic_results && Array.isArray(financeData.organic_results)) {
      for (const app of financeData.organic_results) {
        if (app.product_id === COINBASE_APPLE_ID) {
          financeRank = app.position;
          console.log(`Coinbase found at finance rank: ${financeRank}`);
          break;
        }
      }
    }

    // For overall rank, get top 200 apps across all categories
    const overallUrl = 
      `https://www.searchapi.io/api/v1/search?api_key=${apiKey}&engine=apple_app_store` +
      `&store=us&sort_by=topfreeapplications&num=200`;

    console.log("Fetching overall rankings...");
    const overallResponse = await fetch(overallUrl);
    
    if (overallResponse.ok) {
      const overallData = await overallResponse.json();
      if (overallData.organic_results && Array.isArray(overallData.organic_results)) {
        for (const app of overallData.organic_results) {
          if (app.product_id === COINBASE_APPLE_ID) {
            overallRank = app.position;
            console.log(`Coinbase found at overall rank: ${overallRank}`);
            break;
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