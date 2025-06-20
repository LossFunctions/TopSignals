# TopSignals

This project displays various market signals, including Coinbase App Rank.

## Environment Variables

- `SEARCHAPI_IO_KEY`: API key for searchapi.io. If missing or the API fails, the server will attempt to scrape the App Store.
- `VITE_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`: used for storing historical ranks in Supabase. If not provided, the API runs in read-only mode.

If both the search API and scraper fail, the `/api/coinbaseRank` endpoint now falls back to static mock data so the frontend continues to render a card.
