// api/coinbaseRank.js

// Constants for identifying the Coinbase app
const COINBASE_APPLE_ID  = 886427730
const COINBASE_BUNDLE_ID = 'com.coinbase.app'

export default async function handler(req, res) {
  const apiKey = process.env.SEARCHAPI_IO_KEY
  if (!apiKey) {
    console.error('SearchApi.io API key (SEARCHAPI_IO_KEY) is not configured.')
    return res.status(500).json({ error: 'API key not configured.' })
  }

  try {
    let financeRank = null
    let overallRank = null

    // 1) FINANCE CATEGORY TOP-CHARTS
    const financeUrl =
      `https://www.searchapi.io/api/v1/search?api_key=${apiKey}` +
      `&engine=apple_app_store_top_charts` +
      `&store=us` +
      `&category=finance_apps` +
      `&chart=top_free`

    console.log('Fetching finance category top charts...')
    const financeResponse = await fetch(financeUrl)

    if (financeResponse.status === 429) {
      console.error('Finance API quota exceeded (429)')
      return res.status(429).json({ error: 'finance_quota_exceeded' })
    }
    if (!financeResponse.ok) {
      const errTxt = await financeResponse.text().catch(() => '')
      console.error(`Finance API error: ${financeResponse.status}`, errTxt)
      return res
        .status(502)
        .json({ error: `Finance API failed: ${financeResponse.status}` })
    }

    const financeData = await financeResponse.json()
    if (Array.isArray(financeData.top_charts)) {
      console.log(`Found ${financeData.top_charts.length} apps in finance top charts`)
      for (let i = 0; i < financeData.top_charts.length; i++) {
        const app = financeData.top_charts[i]
        if (
          String(app.id) === String(COINBASE_APPLE_ID) ||
          app.bundle_id === COINBASE_BUNDLE_ID ||
          (app.title || '').toLowerCase().includes('coinbase')
        ) {
          financeRank = app.position ?? i + 1
          console.log(`Coinbase found in finance at #${financeRank}`)
          break
        }
      }
    }

    // 2) OVERALL TOP-100 CHARTS
    console.log('Fetching overall top 100 charts...')
    const overallUrl =
      `https://www.searchapi.io/api/v1/search?api_key=${apiKey}` +
      `&engine=apple_app_store_top_charts` +
      `&store=us` +
      `&chart=top_free`

    const overallResponse = await fetch(overallUrl)

    if (overallResponse.status === 429) {
      console.error('Overall API quota exceeded (429)')
      return res.status(429).json({ error: 'overall_quota_exceeded' })
    }
    if (!overallResponse.ok) {
      const errTxt = await overallResponse.text().catch(() => '')
      console.error(`Overall API error: ${overallResponse.status}`, errTxt)
      return res
        .status(502)
        .json({ error: `Overall API failed: ${overallResponse.status}` })
    }

    const overallData = await overallResponse.json()
    const overallCharts = overallData.top_charts || []
    console.log(`Overall top charts returned ${overallCharts.length} apps`)

    for (let i = 0; i < overallCharts.length; i++) {
      const app = overallCharts[i]
      if (
        String(app.id) === String(COINBASE_APPLE_ID) ||
        app.bundle_id === COINBASE_BUNDLE_ID ||
        (app.title || '').toLowerCase().includes('coinbase')
      ) {
        overallRank = app.position ?? i + 1
        console.log(`Coinbase found in overall top 100 at #${overallRank}`)
        break
      }
    }

    // 3) SEARCH FALLBACK IF NOT IN TOP 100
    if (!overallRank) {
      console.log('Coinbase not in top 100, using search fallback...')
      const searchUrl =
        `https://www.searchapi.io/api/v1/search?api_key=${apiKey}` +
        `&engine=apple_app_store` +
        `&store=us` +
        `&term=coinbase` +
        `&num=20`

      const searchResponse = await fetch(searchUrl)

      if (searchResponse.status === 429) {
        console.error('Search fallback quota exceeded (429)')
        return res.status(429).json({ error: 'search_quota_exceeded' })
      }
      if (!searchResponse.ok) {
        console.error(`Search fallback failed: ${searchResponse.status}`)
      } else {
        const searchData = await searchResponse.json()
        console.log('Search fallback first result:', searchData.organic_results?.[0])
        if (Array.isArray(searchData.organic_results)) {
          for (const app of searchData.organic_results) {
            if (
              Number(app.id) === COINBASE_APPLE_ID ||
              Number(app.product_id) === COINBASE_APPLE_ID ||
              app.bundle_id === COINBASE_BUNDLE_ID
            ) {
              overallRank = app.rank_overall || app.rank || null
              console.log(`Coinbase found via search with rank: ${overallRank}`)
              break
            }
          }
        }
      }
    }

    console.log(`Final ranks - Finance: ${financeRank}, Overall: ${overallRank}`)

    // 4) Send response + cache headers
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=300')
    return res.status(200).json({ financeRank, overallRank })

  } catch (err) {
    console.error('Error in /api/coinbaseRank handler:', err)
    return res.status(500).json({ error: err.message || 'internal server error' })
  }
}
