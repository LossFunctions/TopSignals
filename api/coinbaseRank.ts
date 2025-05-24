// File: api/coinbaseRank.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';

const COINBASE_APPLE_ID = '886427730';

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  const apiKey = process.env.SEARCHAPI_IO_KEY;

  if (!apiKey) {
    console.error("SearchApi.io API key (SEARCHAPI_IO_KEY) is not configured on the server.");
    return res.status(500).json({ error: "API key not configured." });
  }

  // MODIFIED: Added &num=100 to the end of the URL
  const searchApiUrl = `https://www.searchapi.io/api/v1/search?api_key=${apiKey}&engine=apple_app_store&store=us&term=finance&category_id=6015&sort_by=topfreeapplications&num=100`;

  console.log("Attempting to fetch from SearchApi.io with URL:", searchApiUrl);

  try {
    const apiResponse = await fetch(searchApiUrl);
    const responseText = await apiResponse.text();
    
    if (!apiResponse.ok) {
      console.error(`SearchApi.io request failed with status ${apiResponse.status}: ${responseText}`);
      try {
        const errorJson = JSON.parse(responseText);
        return res.status(apiResponse.status).json({ error: errorJson.error || `Failed to fetch from SearchApi.io: ${apiResponse.status}` });
      } catch (e) {
        return res.status(apiResponse.status).json({ error: `Failed to fetch from SearchApi.io: ${apiResponse.status}. Response: ${responseText}` });
      }
    }

    const data = JSON.parse(responseText);

    if (data.error && !data.organic_results) { 
        console.error("SearchApi.io API error:", data.error);
        return res.status(500).json({ error: data.error });
    }

    const appsList = data.organic_results;

    if (!appsList || !Array.isArray(appsList)) {
      console.error("Unexpected response structure: 'organic_results' not found or not an array:", data);
      return res.status(500).json({ error: "Could not parse app list from SearchApi.io response." });
    }

    let coinbaseRank = null;
    for (const app of appsList) {
      const currentAppId = app.product_id; 
      const currentAppPosition = app.position;

      if (currentAppId === COINBASE_APPLE_ID) { 
        coinbaseRank = currentAppPosition; 
        break; 
      }
    }
    
    if (coinbaseRank === null) {
        console.warn(`Coinbase (ID: ${COINBASE_APPLE_ID}) not found in the first ${appsList.length} results.`);
    } else {
        console.log(`Coinbase found at rank: ${coinbaseRank}`);
    }

    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate'); 
    res.status(200).json({ rank: coinbaseRank });

  } catch (err: any) {
    console.error("Error in /api/coinbaseRank handler:", err);
    res.status(500).json({ error: err.message || "An internal server error occurred." });
  }
}