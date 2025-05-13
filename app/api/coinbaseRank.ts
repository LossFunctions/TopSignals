import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const response = await fetch('https://rss.applemarketingtools.com/api/v2/us/apps/top-free/200/finance.json');
    if (!response.ok) {
      return res.status(502).json({ error: 'Failed to fetch Apple API' });
    }
    const data = await response.json();
    console.log('Apple API response:', JSON.stringify(data, null, 2));
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}
