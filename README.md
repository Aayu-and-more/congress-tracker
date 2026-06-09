# CapitolTrades

CapitolTrades is a Next.js 16 app that tracks every stock trade publicly disclosed by US senators and representatives under the STOCK Act. It syncs trade data from the Capitol Trades public API, stores it in a local SQLite database via Prisma, and surfaces a live feed, per-member profiles, a leaderboard, and per-ticker drill-downs — all in a dark-themed dashboard.

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Edit environment variables
cp .env.local .env.local   # fill in FINNHUB_API_KEY and SYNC_SECRET

# 3. Run database migrations
npx prisma migrate dev

# 4. Start the dev server
npm run dev
# → http://localhost:3000

# 5. Seed trade data (run once after the server is up)
curl -X POST http://localhost:3000/api/sync \
  -H "Authorization: Bearer YOUR_SYNC_SECRET"
```

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `FINNHUB_API_KEY` | Optional | Finnhub API key for live price data |
| `SYNC_SECRET` | Required | Bearer token used to authorize `POST /api/sync` |
| `NEXT_PUBLIC_BASE_URL` | Optional | Full origin URL (default `http://localhost:3000`). Used by client-side code. |

## Data Sources

- **Senate disclosures** — U.S. Senate STOCK Act filings via [Capitol Trades](https://www.capitoltrades.com/) public API
- **House disclosures** — U.S. House of Representatives STOCK Act filings via Capitol Trades
- **Price data** — [Finnhub](https://finnhub.io/) (optional, for enriching trades with live quotes)
