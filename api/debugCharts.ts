import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  const apiKey = process.env.SEARCHAPI_IO_KEY;
  
  if (!apiKey) {
    return res.status(500).json({ error: "API key not configured." });
  }

  try {
    // Test the CORRECT top charts endpoint
    const testUrl = 
      `https://www.searchapi.io/api/v1/search?api_key=${apiKey}` +
      `&engine=apple_app_store_top_charts` +
      `&store=us` +
      `&category=finance_apps` +
      `&chart=top_free` +
      `&num=10`;

    console.log("Testing URL:", testUrl);
    const response = await fetch(testUrl);
    const data = await response.json();
    
    return res.status(200).json({ 
      status: response.status,
      hasTopCharts: !!data.top_charts,
      topChartsCount: data.top_charts?.length || 0,
      firstApp: data.top_charts?.[0] || null,
      allResponseKeys: Object.keys(data),
      searchApiDocs: "https://www.searchapi.io/docs/apple-app-store-top-charts"
    });

  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}