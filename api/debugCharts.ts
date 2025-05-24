import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  const apiKey = process.env.SEARCHAPI_IO_KEY;
  
  if (!apiKey) {
    return res.status(500).json({ error: "API key not configured." });
  }

  try {
    // Try different URL patterns to see what works
    const urls = [
      // Chart endpoint
      `https://www.searchapi.io/api/v1/search?api_key=${apiKey}&engine=apple_app_store&store=us&category_id=6015&chart=topfreeapplications&num=10`,
      // Search with sort
      `https://www.searchapi.io/api/v1/search?api_key=${apiKey}&engine=apple_app_store&store=us&category_id=6015&sort_by=topfreeapplications&num=10`,
      // Direct search for Coinbase
      `https://www.searchapi.io/api/v1/search?api_key=${apiKey}&engine=apple_app_store&store=us&term=coinbase&num=5`
    ];

    const results = [];
    
    for (const [index, url] of urls.entries()) {
      const response = await fetch(url);
      const data = await response.json();
      
      results.push({
        urlIndex: index,
        status: response.status,
        hasOrganicResults: !!data.organic_results,
        organicResultsCount: data.organic_results?.length || 0,
        sampleApp: data.organic_results?.[0] || null,
        allKeys: Object.keys(data)
      });
    }

    return res.status(200).json({ 
      debug: true,
      results,
      searchApiDocs: "https://www.searchapi.io/docs/apple-app-store"
    });

  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}