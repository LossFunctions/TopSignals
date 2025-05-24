import type { VercelRequest, VercelResponse } from '@vercel/node';

const COINBASE_APPLE_ID = '886427730';

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  const apiKey = process.env.SEARCHAPI_IO_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured.' });
  }

  try {
    // Fetch finance category rankings
    const financeUrl = 
      `https://www.searchapi.io/api/v1/search?api_key=${apiKey}&engine=apple_app_store` +
      `&store=us&category_id=6015&sort_by=topfreeapplications&num=200`;

    // Fetch overall rankings (all categories)
    const overallUrl = 
      `https://www.searchapi.io/api/v1/search?api_key=${apiKey}&engine=apple_app_store` +
      `&store=us&sort_by=topfreeapplications&num=200`;

    const [financeResponse, overallResponse] = await Promise.all([
      fetch(financeUrl),
      fetch(overallUrl)
    ]);

    if (!financeResponse.ok) {
      throw new Error(`Finance API error: ${financeResponse.status} ${financeResponse.statusText}`);
    }
    if (!overallResponse.ok) {
      throw new Error(`Overall API error: ${overallResponse.status} ${overallResponse.statusText}`);
    }

    const financeData = await financeResponse.json();
    const overallData = await overallResponse.json();

    let financeRank: number | null = null;
    let overallRank: number | null = null;

    // Find Coinbase in finance category results
    if (financeData.organic_results && Array.isArray(financeData.organic_results)) {
      for (let i = 0; i < financeData.organic_results.length; i++) {
        const app = financeData.organic_results[i];
        if (app.product_id === COINBASE_APPLE_ID) {
          financeRank = i + 1; // Position is 0-indexed, so add 1
          break;
        }
      }
    }

    // Find Coinbase in overall results
    if (overallData.organic_results && Array.isArray(overallData.organic_results)) {
      for (let i = 0; i < overallData.organic_results.length; i++) {
        const app = overallData.organic_results[i];
        if (app.product_id === COINBASE_APPLE_ID) {
          overallRank = i + 1; // Position is 0-indexed, so add 1
          break;
        }
      }
    }

    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate');
    return res.status(200).json({ 
      financeRank: financeRank,
      overallRank: overallRank 
    });

  } catch (err: any) {
    console.error('API Error:', err);
    return res.status(500).json({ error: err.message });
  }
}