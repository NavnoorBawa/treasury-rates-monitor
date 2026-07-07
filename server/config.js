export const PORT = Number(process.env.PORT ?? 4174);

export const CACHE_TTL_MS = Number(process.env.CACHE_TTL_MS ?? 10 * 60 * 1000);

export const HISTORY_CACHE_TTL_MS = Number(process.env.HISTORY_CACHE_TTL_MS ?? 30 * 60 * 1000);

export const TREASURY_FEED_URL =
  "https://home.treasury.gov/resource-center/data-chart-center/interest-rates/pages/xml";

export const TREASURY_DATASET = "daily_treasury_yield_curve";

export const DATA_SOURCE = {
  name: "U.S. Treasury Daily Treasury Par Yield Curve Rates",
  pageUrl:
    "https://home.treasury.gov/resource-center/data-chart-center/interest-rates/TextView?type=daily_treasury_yield_curve",
  feedUrl: `${TREASURY_FEED_URL}?data=${TREASURY_DATASET}`
};

export const DASHBOARD_MATURITIES = [
  { key: "2Y", label: "2 Year", shortLabel: "2Y", field: "BC_2YEAR", years: 2 },
  { key: "5Y", label: "5 Year", shortLabel: "5Y", field: "BC_5YEAR", years: 5 },
  { key: "10Y", label: "10 Year", shortLabel: "10Y", field: "BC_10YEAR", years: 10 },
  { key: "30Y", label: "30 Year", shortLabel: "30Y", field: "BC_30YEAR", years: 30 }
];

export const CURVE_MATURITIES = [
  { key: "1M", label: "1 Month", shortLabel: "1M", field: "BC_1MONTH", years: 1 / 12 },
  { key: "3M", label: "3 Month", shortLabel: "3M", field: "BC_3MONTH", years: 0.25 },
  { key: "6M", label: "6 Month", shortLabel: "6M", field: "BC_6MONTH", years: 0.5 },
  { key: "1Y", label: "1 Year", shortLabel: "1Y", field: "BC_1YEAR", years: 1 },
  ...DASHBOARD_MATURITIES.slice(0, 1),
  { key: "3Y", label: "3 Year", shortLabel: "3Y", field: "BC_3YEAR", years: 3 },
  ...DASHBOARD_MATURITIES.slice(1, 2),
  { key: "7Y", label: "7 Year", shortLabel: "7Y", field: "BC_7YEAR", years: 7 },
  ...DASHBOARD_MATURITIES.slice(2, 3),
  { key: "20Y", label: "20 Year", shortLabel: "20Y", field: "BC_20YEAR", years: 20 },
  ...DASHBOARD_MATURITIES.slice(3)
];

export const HISTORY_WINDOW_DAYS = Number(process.env.HISTORY_WINDOW_DAYS ?? 365);

export const FED_H15_TREASURY_CMT_URL =
  "https://www.federalreserve.gov/datadownload/Output.aspx?rel=H15&series=bf17364827e38702b42a58cf8eaa3f78&lastobs=&from=&to=&filetype=csv&label=include&layout=seriescolumn&type=package";

export const HISTORICAL_SOURCE = {
  name: "Federal Reserve H.15 Data Download Program - Treasury Constant Maturities",
  pageUrl: "https://www.federalreserve.gov/datadownload/Choose.aspx?rel=H15",
  downloadUrl: FED_H15_TREASURY_CMT_URL,
  primaryUse:
    "Long-run official historical Treasury constant maturity series. Latest current observation is supplemented from Treasury XML when Treasury has a newer official record."
};

export const HISTORICAL_MATURITIES = [
  { key: "3M", label: "3 Month", shortLabel: "3M", field: "RIFLGFCM03_N.B", years: 0.25 },
  { key: "2Y", label: "2 Year", shortLabel: "2Y", field: "RIFLGFCY02_N.B", years: 2 },
  { key: "5Y", label: "5 Year", shortLabel: "5Y", field: "RIFLGFCY05_N.B", years: 5 },
  { key: "10Y", label: "10 Year", shortLabel: "10Y", field: "RIFLGFCY10_N.B", years: 10 },
  { key: "30Y", label: "30 Year", shortLabel: "30Y", field: "RIFLGFCY30_N.B", years: 30 }
];

export const RESEARCH_SPREADS = [
  { key: "10Y2Y", label: "10Y - 2Y", longLabel: "10Y minus 2Y", minuend: "10Y", subtrahend: "2Y" },
  { key: "30Y5Y", label: "30Y - 5Y", longLabel: "30Y minus 5Y", minuend: "30Y", subtrahend: "5Y" },
  { key: "5Y2Y", label: "5Y - 2Y", longLabel: "5Y minus 2Y", minuend: "5Y", subtrahend: "2Y" },
  { key: "10Y3M", label: "10Y - 3M", longLabel: "10Y minus 3M", minuend: "10Y", subtrahend: "3M" }
];
