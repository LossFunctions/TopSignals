import type { NextRequest } from 'next/server';
import { SMA } from 'technicalindicators';

const COINGECKO = 'https://api.coingecko.com/api/v3/coins/bitcoin/market_chart';

export const runtime = 'edge';                    // keep bundle tiny
export const revalidate = 86400;                  // cache 24 h

export async function GET(req: NextRequest) {
  try {
    /* 1. fetch last 400 daily candles */
    const url = `${COINGECKO}?vs_currency=usd&days=400&precision=full`;
    const resp = await fetch(url, {
      headers: { 'x-cg-demo-api-key': process.env.COINGECKO_API_KEY! }
    });
    if (!resp.ok) throw new Error(`CG ${resp.status}`);
    const { prices } = await resp.json() as { prices: [number, number][] };

    const closes = prices.map(p => p[1]);        // [timestamp, price]

    /* 2. calculate SMAs */
    const sma111 = SMA.calculate({ period: 111, values: closes });
    const sma350 = SMA.calculate({ period: 350, values: closes });
    const sma350x2 = sma350.map(v => v * 2);

    const latestIdx = closes.length - 1;
    const sma111Latest = sma111[sma111.length - 1];
    const sma350x2Latest = sma350x2[sma350x2.length - 1];

    /* 3. cross detection (compare today vs yesterday) */
    const crossed =
      sma111Latest > sma350x2Latest &&
      sma111[sma111.length - 2] <= sma350x2[sma350x2.length - 2];

    const distancePct = (sma111Latest - sma350x2Latest) / sma350x2Latest * 100;

    return Response.json({
      time: new Date(prices[latestIdx][0]).toISOString(),
      sma111: sma111Latest,
      sma350x2: sma350x2Latest,
      crossed,
      distancePct
    }, { headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=86400' } });
  } catch (err: any) {
    return new Response(err.message || 'error', { status: 500 });
  }
}