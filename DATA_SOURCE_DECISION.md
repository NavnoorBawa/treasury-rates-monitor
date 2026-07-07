# Data Source Decision

## Decision

Use a two-source architecture:

1. Official U.S. Department of the Treasury Daily Treasury Interest Rate XML feed for current/latest values.
2. Official Federal Reserve H.15 Data Download Program Treasury Constant Maturities package for long-run daily historical analysis.

FRED is credible and professor-friendly as a reference, but it is not the best primary production feed here because it republishes Treasury constant maturity data through the Federal Reserve/FRED ecosystem and can lag the Treasury feed. The Treasury XML feed is the direct publisher for the Daily Treasury Par Yield Curve Rates used in the top current-market dashboard. The Federal Reserve H.15 DDP is the best free official source for long-run historical research because it provides a direct automated CSV package with all Treasury constant maturity observations.

## Sources Compared

### 1. U.S. Treasury Daily Treasury Interest Rate XML Feed

Primary source for Daily Treasury Par Yield Curve Rates.

- Official XML feed documentation: https://home.treasury.gov/treasury-daily-interest-rate-xml-feed
- Official data page: https://home.treasury.gov/resource-center/data-chart-center/interest-rates/TextView?type=daily_treasury_yield_curve
- Data key used by this app: `daily_treasury_yield_curve`
- Maturities available include 1M, 1.5M, 2M, 3M, 4M, 6M, 1Y, 2Y, 3Y, 5Y, 7Y, 10Y, 20Y, and 30Y.
- No API key required.
- Free, official, and directly maintained by Treasury.

The Treasury documentation says the feed accepts GET requests, returns XML responses, and supports standard HTTP response codes. Treasury also documents the exact endpoint used by this app:

```text
https://home.treasury.gov/resource-center/data-chart-center/interest-rates/pages/xml?data=daily_treasury_yield_curve&field_tdr_date_value=YYYY
```

### 2. FRED / St. Louis Fed

Reliable secondary reference and excellent academic citation source.

- FRED API documentation: https://fred.stlouisfed.org/docs/api/fred/
- FRED API key documentation: https://fred.stlouisfed.org/docs/api/api_key.html
- Relevant series: `DGS2`, `DGS5`, `DGS10`, `DGS30`

FRED identifies the source of these Treasury constant maturity series as the Board of Governors of the Federal Reserve System and the release as H.15 Selected Interest Rates. Its official API requires a registered API key for web service requests. FRED is a strong secondary source, but it is not the original publisher of the Treasury par yield curve.

### 3. Federal Reserve H.15 Selected Interest Rates

Official and reliable, but the Fed notes that nominal Treasury constant maturity yields are interpolated by the U.S. Treasury from the daily yield curve.

- H.15 release: https://www.federalreserve.gov/releases/h15/
- H.15 Data Download Program: https://www.federalreserve.gov/datadownload/Choose.aspx?rel=H15
- Direct Treasury Constant Maturities CSV package: `https://www.federalreserve.gov/datadownload/Output.aspx?rel=H15&series=bf17364827e38702b42a58cf8eaa3f78&lastobs=&from=&to=&filetype=csv&label=include&layout=seriescolumn&type=package`

The H.15 release is useful for cross-checking, academic context, and long-run history. For latest daily CMT values, Treasury remains closer to the source. For long-run daily historical analysis, the H.15 DDP package is better than Treasury XML because it extends earlier than Treasury's documented Daily Treasury Par Yield Curve XML availability.

## Freshness Check on July 7, 2026

At verification time:

- Treasury XML latest observation: `2026-07-06`
  - 2Y: `4.13`
  - 5Y: `4.21`
  - 10Y: `4.48`
  - 30Y: `4.99`
- FRED CSV latest observation for `DGS2,DGS5,DGS10,DGS30`: `2026-07-02`
  - 2Y: `4.14`
  - 5Y: `4.23`
  - 10Y: `4.49`
  - 30Y: `4.98`

Because the Treasury feed is currently fresher and is the direct official source, it is the better production source for this dashboard.

## Long-Run History Check

The H.15 Treasury Constant Maturities package provides materially longer history than Treasury XML:

- 5Y and 10Y: daily observations from `1962-01-02`.
- 2Y: daily observations from `1976-06-01`.
- 30Y: daily observations from `1977-02-15`, with the known 30Y discontinuation/reintroduction gap preserved as missing values.
- 3M is included for 10Y-3M curve-spread analysis from `1981-09-01`.

This makes H.15 DDP the best official free historical feed for macro-regime analysis, while Treasury XML remains the best latest-current feed.

## Recommendation

Keep Treasury XML as the primary current-data source and Federal Reserve H.15 DDP as the primary historical research source.

For a larger production system, FRED should be added as a secondary validation/citation source, not as the primary feed. The dashboard can display a source badge and optionally warn if Treasury, H.15, and FRED diverge after all sources have updated.
