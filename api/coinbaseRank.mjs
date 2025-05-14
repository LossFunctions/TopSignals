import type { VercelRequest, VercelResponse } from '@vercel/node';

const FEED = 'https://rss.applemarketingtools.com/api/v2/us/apps/top-free/200/finance.json';
const COINBASE_ID = '886427730';

export default async function handler(_: VercelRequest, res: VercelResponse) {
  try {
    const r = await fetch(FEED);
    if (!r.ok) throw new Error('Apple feed failed');
    const data = await r.json();
    const idx = data.feed.results.findIndex((a: any) => a.id === COINBASE_ID);
    const rank = idx === -1 ? null : idx + 1;
    // cache for 5 min
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate');
    res.status(200).json({ rank });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
