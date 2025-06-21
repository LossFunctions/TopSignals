import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  const apiKey = process.env.SEARCHAPI_IO_KEY;
  
  if (!apiKey) {
    return res.status(500).json({ error: "API key not configured." });
  }

  try {
    const results = [];
    
    // Test 1: Overall charts without category (should work)
    const overallUrl1 = 
      `https://www.searchapi.io/api/v1/search?api_key=${apiKey}` +
      `&engine=apple_app_store_top_charts` +
      `&store=us` +
      `&chart=top_free` +
      `&num=200` +
      `&page=1`;
    
    const resp1 = await fetch(overallUrl1);
    results.push({
      test: "Overall without category",
      status: resp1.status,
      url: overallUrl1.replace(apiKey, 'REDACTED')
    });
    
    // Test 2: Overall charts with category=all (should work)
    const overallUrl2 = 
      `https://www.searchapi.io/api/v1/search?api_key=${apiKey}` +
      `&engine=apple_app_store_top_charts` +
      `&store=us` +
      `&category=all` +
      `&chart=top_free` +
      `&num=200` +
      `&page=1`;
    
    const resp2 = await fetch(overallUrl2);
    results.push({
      test: "Overall with category=all",
      status: resp2.status,
      url: overallUrl2.replace(apiKey, 'REDACTED')
    });
    
    // Test 3: Page 2 (positions 201-400)
    const pageUrl = 
      `https://www.searchapi.io/api/v1/search?api_key=${apiKey}` +
      `&engine=apple_app_store_top_charts` +
      `&store=us` +
      `&chart=top_free` +
      `&num=200` +
      `&page=2`;
    
    const resp3 = await fetch(pageUrl);
    let page2Data = null;
    if (resp3.ok) {
      page2Data = await resp3.json();
    }
    results.push({
      test: "Page 2 pagination",
      status: resp3.status,
      hasTopCharts: !!page2Data?.top_charts,
      firstAppOnPage2: page2Data?.top_charts?.[0]?.title || null
    });
    
    // Test 4: Search fallback
    const searchUrl = 
      `https://www.searchapi.io/api/v1/search?api_key=${apiKey}` +
      `&engine=apple_app_store` +
      `&store=us` +
      `&term=coinbase` +
      `&num=1`;
    
    const resp4 = await fetch(searchUrl);
    let searchData = null;
    if (resp4.ok) {
      searchData = await resp4.json();
    }
    results.push({
      test: "Search for Coinbase",
      status: resp4.status,
      firstResult: searchData?.organic_results?.[0] || null,
      availableRankFields: searchData?.organic_results?.[0] ? 
        Object.keys(searchData.organic_results[0]).filter(k => k.includes('rank')) : []
    });
    
    return res.status(200).json({ 
      tests: results,
      documentation: "https://www.searchapi.io/docs/apple-app-store-top-charts"
    });

  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}