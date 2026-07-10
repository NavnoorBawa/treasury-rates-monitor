# U.S. Treasury Yield Dashboard

A clean institutional-style dashboard for U.S. Treasury Constant Maturity rates. It displays current 2Y, 5Y, 10Y, and 30Y yields, daily moves in basis points and percent, a separate intraday benchmark reference, six core curve spreads, date-to-date curve comparison, long-run macro research, and light/dark themes.

Live deployment: <https://treasury-yield-dashboard.vercel.app>

## Data Source

The backend reads the official U.S. Treasury XML feed for Daily Treasury Par Yield Curve Rates:

- Source page: <https://home.treasury.gov/resource-center/data-chart-center/interest-rates/TextView?type=daily_treasury_yield_curve>
- XML feed pattern: `https://home.treasury.gov/resource-center/data-chart-center/interest-rates/pages/xml?data=daily_treasury_yield_curve&field_tdr_date_value=YYYY`

No API key is required. The server fetches the current New York calendar year plus the prior year, normalizes the XML, computes daily changes against the previous Treasury observation, and caches the result for 10 minutes by default. The frontend refreshes automatically every 15 minutes while open.

Treasury CMTs are official end-of-day values. Treasury derives them from indicative bid-side quotations obtained by the Federal Reserve Bank of New York at or near 3:30 PM ET each business day, so no free official intraday CMT update exists. Faster polling would not make the underlying official curve fresher.

FRED was reviewed as a possible primary source because it is academically familiar and reliable. The app intentionally keeps Treasury as primary for current values because Treasury is the direct official publisher of the Daily Treasury Par Yield Curve Rates, while FRED republishes the relevant DGS series from the Federal Reserve/H.15 ecosystem and its official API requires an API key.

For long-run regime analysis, the app also uses the official Federal Reserve H.15 Data Download Program preformatted Treasury Constant Maturities CSV package:

- H.15 DDP page: <https://www.federalreserve.gov/datadownload/Choose.aspx?rel=H15>
- Direct CSV package: `https://www.federalreserve.gov/datadownload/Output.aspx?rel=H15&series=bf17364827e38702b42a58cf8eaa3f78&lastobs=&from=&to=&filetype=csv&label=include&layout=seriescolumn&type=package`

This gives reliable long-run daily history back to the earliest available H.15 observations, while Treasury XML supplements the newest current observation if Treasury has published a later record than H.15/FRED. See [DATA_SOURCE_DECISION.md](./DATA_SOURCE_DECISION.md) for the source comparison and freshness check.

## Research Features

- A separate TradingView intraday reference for 2Y, 5Y, 10Y, and 30Y U.S. benchmark-bond yields. The embedded chart defaults to five-minute bars and is explicitly excluded from official CMT calculations, statistics, regimes, and exports.
- Long-run historical data for 2Y, 5Y, 10Y, and 30Y Treasury yields.
- Trader-style workspace tabs: Market, Intraday, Compare, History, and Regimes. Only the active research view is shown, avoiding the previous stacked-scroll layout.
- Date-range presets: 1Y, 5Y, 10Y, 20Y, Max, plus custom start/end dates.
- Six core 2Y/5Y/10Y/30Y curve combinations: 5Y-2Y, 10Y-2Y, 30Y-2Y, 10Y-5Y, 30Y-5Y, and 30Y-10Y.
- Date-to-date yield curve comparison with custom as-of/reference dates and 1W, 1M, 1Y, and range-start shortcuts.
- Macro event markers with focus actions that apply the event window and return directly to the rates/spreads view.
- A weekly or monthly color-coded curve-regime ribbon for each of the six segments. Classifications use non-overlapping completed calendar intervals, while the daily spread remains a separate line. The six classifications are bull steepening, bear steepening, bull flattening, bear flattening, parallel shift higher, and parallel shift lower. Near-parallel uses a disclosed 3 bps weekly or 5 bps monthly slope tolerance; open periods remain unclassified.
- Selected-range CSV export containing dates, 2Y/5Y/10Y/30Y yields, and all six core curve spreads.
- Selected-period statistics: latest, min, max, average, annualized daily-change volatility, 1M/3M/1Y changes, empirical percentile rank, and observation count. Momentum changes use the nearest valid observation on or before the calendar lookback even when it predates the visible range.
- Light and dark themes for presentation use.

Historical charts use observed business-day data only. Weekends, federal market holidays, and source-level `ND` observations are not imputed. Treasury stopped issuing the 30Y on February 18, 2002 and resumed publication of the observed 30Y CMT on February 9, 2006; the dashboard explicitly preserves February 18, 2002 through February 8, 2006 as unavailable rather than treating H.15's interim estimated values as observed 30Y quotations. Dependent 30Y spreads are consequently unavailable for that interval. A methodology marker identifies Treasury's December 6, 2021 shift from quasi-cubic Hermite to monotone-convex curve construction; both regimes remain official, but long-run comparisons should recognize the change.

## Quick Start

```bash
npm install
npm run dev
```

Open <http://localhost:5173>. Vite proxies `/api` requests to the Express backend on port `4174`.

## Production Run

```bash
npm run build
npm start
```

Open <http://localhost:4174>. In production, Express serves both `/api/yields` and the built frontend from `dist/`.

## Scripts

- `npm run dev`: start Vite and Express together.
- `npm run build`: type-check and create the production frontend bundle.
- `npm start`: run the production Express server.
- `npm run preview`: preview only the Vite build.
- `npm run verify:data`: fetch official sources and assert current values, history coverage, latest-source merge, and spread calculations.

## Configuration

Optional environment variables:

- `PORT`: production/server port. Default: `4174`.
- `CACHE_TTL_MS`: backend Treasury data cache duration. Default: `600000`.
- `HISTORY_WINDOW_DAYS`: lookback window for historical charts. Default: `365`.
- `HISTORY_CACHE_TTL_MS`: long-run H.15 cache duration. Default: `1800000`.

## API

`GET /api/yields`

Returns:

- `summary`: current 2Y, 5Y, 10Y, and 30Y yields plus prior observation, daily bps change, and daily percent change.
- `curve`: latest official curve points.
- `history`: one-year historical series for each dashboard maturity.
- `spreads`: all six current 2Y/5Y/10Y/30Y curve spreads with daily basis-point changes.
- `source`: Treasury source links, latest official record date, previous record date, feed timestamp, and retrieval timestamp.
- `cache`: cache status (`hit`, `refresh`, or `stale`).

`GET /api/history`

Returns:

- `rows`: long-run H.15 daily Treasury constant maturity observations for 2Y, 5Y, 10Y, and 30Y, plus computed fields for all six pairwise curve spreads.
- `maturities`: maturity metadata used by the research charts.
- `spreads`: spread definitions.
- `availability`: first/last valid dates and observation counts by maturity.
- `source`: H.15 source metadata, Treasury supplement status, and limitations note.
- `cache`: cache status.

## Project Structure

```text
server/
  cache.js              In-memory cache
  config.js             Source URLs, maturity definitions, runtime config
  historicalClient.js   Federal Reserve H.15 DDP CSV fetch/parse/normalize logic
  index.js              Express app, API routes, production static serving
  treasuryClient.js     Treasury XML fetch/parse/normalize logic
src/
  components/           Tabbed workspace, curve matrix, comparison, charts, and regime timeline
  hooks/                Data refresh and theme hooks
  lib/                  Formatting, event, range, and statistics utilities
  styles/               Theme tokens and responsive layout
  types.ts              Shared frontend data contracts
```

## Deployment

The current recommended deployment target is Vercel because it supports the Vite frontend plus Node serverless API routes on the free Hobby plan without Render-style idle spin-down.

This project includes:

- `api/health.js`
- `api/yields.js`
- `api/history.js`
- `vercel.json`
- `public/robots.txt`, `public/sitemap.xml`, and `public/404.html`

Security headers are configured in `vercel.json` for Vercel and through Helmet for the local Express production server. The app has no required secrets or API keys.

Deploy with:

```bash
npx vercel --prod
```

Production URL:

```text
https://treasury-yield-dashboard.vercel.app
```

You can also use any Node 22 host that can run an Express server.

Recommended settings for Render, Railway, Fly.io, or similar:

- Build command: `npm ci && npm run build`
- Start command: `npm start`
- Health check: `/api/health`
- Required secrets: none

For static-only hosts, keep the backend deployed separately and point the frontend to that API, or use a platform function to proxy Treasury XML requests. The included one-service Express setup is the simplest deployment path.
