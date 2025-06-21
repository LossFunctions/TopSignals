import { SMA } from 'technicalindicators';

export default async function handler(req, res) {
  try {
    // --- 1· CoinGecko fetch (≤ 365 days) ---
    const url =
      'https://api.coingecko.com/api/v3/coins/bitcoin/market_chart' +
      '?vs_currency=usd&days=365&precision=full';        // ← 365!

    const key = process.env.COINGECKO_API_KEY;
    console.log('[PiCycle] key len:', key?.length ?? 0);

    const headers = key ? { 'x-cg-demo-api-key': key } : {};
    const resp    = await fetch(url, { headers });

    if (!resp.ok) {
      const body = await resp.text().catch(() => '');
      console.error('[PiCycle] CG error', resp.status, body);
      return res.status(502).json({ error: `CoinGecko ${resp.status}` });
    }

    // --- 2· Parse + SMA maths ---
    const { prices = [] } = await resp.json();
    if (prices.length < 350) {
      return res.status(502).json({ error: 'Not enough data from CoinGecko' });
    }

    const closes   = prices.map(([, p]) => p);
    const sma111   = SMA.calculate({ period: 111, values: closes });
    const sma350   = SMA.calculate({ period: 350, values: closes });
    const sma350x2 = sma350.map((v) => v * 2);

    const idx   = closes.length - 1;
    const a     = sma111[sma111.length - 1];
    const b     = sma350x2[sma350x2.length - 1];
    const crossed =
      a > b && sma111[sma111.length - 2] <= sma350x2[sma350x2.length - 2];
    const distancePct = ((a - b) / b) * 100;

    const result = {
      time:       new Date(prices[idx][0]).toISOString(),
      sma111:     a,
      sma350x2:   b,
      crossed,
      distancePct,
    };

    // --- 3· Send + cache ---
    res.setHeader(
      'Cache-Control',
      'public, s-maxage=86400, stale-while-revalidate=86400'
    );
    res.status(200).json(result);
  } catch (err) {
    console.error('[PiCycle] exception', err);
    res.status(500).json({ error: err.message || 'internal server error' });
  }
}
