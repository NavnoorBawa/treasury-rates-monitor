import type { HistoricalRow, ResearchMaturityKey, SpreadKey } from "../types";

export type RangePreset = "1Y" | "5Y" | "10Y" | "20Y" | "MAX" | "CUSTOM";

export interface MacroEvent {
  id: string;
  title: string;
  category: "Crisis" | "Policy" | "Geopolitical" | "Recession" | "Market";
  startDate: string;
  endDate?: string;
  description: string;
}

export const maturityKeys: ResearchMaturityKey[] = ["2Y", "5Y", "10Y", "30Y"];

export const spreadKeys: SpreadKey[] = ["10Y2Y", "30Y5Y", "5Y2Y", "10Y3M"];

export const macroEvents: MacroEvent[] = [
  {
    id: "volcker",
    title: "Volcker tightening peak",
    category: "Policy",
    startDate: "1981-06-01",
    endDate: "1982-11-30",
    description: "High-rate disinflation period and early-1980s recession."
  },
  {
    id: "black-monday",
    title: "Black Monday",
    category: "Market",
    startDate: "1987-10-19",
    description: "Equity market crash and policy liquidity response."
  },
  {
    id: "fed-1994",
    title: "1994 Fed hike cycle",
    category: "Policy",
    startDate: "1994-02-04",
    endDate: "1995-02-01",
    description: "Rapid tightening cycle that repriced duration risk."
  },
  {
    id: "asian-ltcm",
    title: "Asia/LTCM stress",
    category: "Crisis",
    startDate: "1997-07-02",
    endDate: "1998-10-15",
    description: "Asian financial crisis, Russia default, and LTCM rescue."
  },
  {
    id: "dot-com",
    title: "Dot-com crash",
    category: "Market",
    startDate: "2000-03-10",
    endDate: "2002-10-09",
    description: "Equity bubble unwind and early-2000s easing cycle."
  },
  {
    id: "911",
    title: "September 11 attacks",
    category: "Geopolitical",
    startDate: "2001-09-11",
    description: "Geopolitical shock and flight-to-quality episode."
  },
  {
    id: "fed-2004",
    title: "2004-06 Fed hikes",
    category: "Policy",
    startDate: "2004-06-30",
    endDate: "2006-06-29",
    description: "Measured-pace tightening from 1% to 5.25% fed funds target."
  },
  {
    id: "gfc",
    title: "Global Financial Crisis",
    category: "Crisis",
    startDate: "2007-08-09",
    endDate: "2009-03-09",
    description: "Credit crisis, bank failures, ZIRP, and extraordinary policy easing."
  },
  {
    id: "taper-tantrum",
    title: "Taper tantrum",
    category: "Policy",
    startDate: "2013-05-22",
    endDate: "2013-09-18",
    description: "Sharp repricing after the Fed signaled potential QE tapering."
  },
  {
    id: "debt-ceiling-2011",
    title: "2011 debt-ceiling crisis",
    category: "Policy",
    startDate: "2011-08-05",
    endDate: "2011-08-08",
    description: "S&P U.S. sovereign downgrade and safe-haven Treasury rally during fiscal stress."
  },
  {
    id: "fed-2015",
    title: "2015-18 Fed hikes",
    category: "Policy",
    startDate: "2015-12-16",
    endDate: "2018-12-19",
    description: "Post-GFC normalization cycle and curve flattening."
  },
  {
    id: "tariffs-2018",
    title: "U.S.-China tariff shock",
    category: "Geopolitical",
    startDate: "2018-03-22",
    endDate: "2019-08-01",
    description: "Trade-war escalation and growth-risk repricing."
  },
  {
    id: "repo-2019",
    title: "Repo market stress",
    category: "Market",
    startDate: "2019-09-17",
    description: "Short-term funding stress and Fed balance sheet response."
  },
  {
    id: "covid",
    title: "COVID-19 shock",
    category: "Crisis",
    startDate: "2020-02-19",
    endDate: "2020-04-09",
    description: "Pandemic risk-off, emergency Fed cuts, QE, and fiscal response."
  },
  {
    id: "russia-ukraine",
    title: "Russia-Ukraine war",
    category: "Geopolitical",
    startDate: "2022-02-24",
    description: "Energy/inflation shock and geopolitical risk premium."
  },
  {
    id: "fed-2022",
    title: "2022-23 Fed hike cycle",
    category: "Policy",
    startDate: "2022-03-16",
    endDate: "2023-07-26",
    description: "Fastest modern tightening cycle against post-pandemic inflation."
  },
  {
    id: "svb",
    title: "Regional banking crisis",
    category: "Crisis",
    startDate: "2023-03-10",
    endDate: "2023-05-01",
    description: "SVB failure, deposit stress, and policy backstops."
  },
  {
    id: "tariffs-2025",
    title: "2025 tariff announcements",
    category: "Geopolitical",
    startDate: "2025-04-02",
    description: "Renewed tariff-risk repricing and inflation/growth uncertainty."
  }
];

export const rangePresetLabels: Record<RangePreset, string> = {
  "1Y": "1Y",
  "5Y": "5Y",
  "10Y": "10Y",
  "20Y": "20Y",
  MAX: "Max",
  CUSTOM: "Custom"
};

const addYears = (date: Date, years: number) => {
  const next = new Date(date);
  next.setUTCFullYear(next.getUTCFullYear() + years);
  return next;
};

const addMonths = (date: Date, months: number) => {
  const next = new Date(date);
  next.setUTCMonth(next.getUTCMonth() + months);
  return next;
};

export const isoToDate = (isoDate: string) => new Date(`${isoDate}T00:00:00Z`);

export const toIsoDate = (date: Date) => date.toISOString().slice(0, 10);

export const getPresetRange = (preset: Exclude<RangePreset, "CUSTOM">, rows: HistoricalRow[]) => {
  const first = rows[0]?.date ?? "";
  const last = rows.at(-1)?.date ?? "";
  if (!first || !last) return { start: "", end: "" };
  if (preset === "MAX") return { start: first, end: last };

  const years = Number(preset.replace("Y", ""));
  return {
    start: toIsoDate(addYears(isoToDate(last), -years)),
    end: last
  };
};

export const getEventFocusRange = (event: MacroEvent, rows: HistoricalRow[]) => {
  const first = rows[0]?.date ?? event.startDate;
  const last = rows.at(-1)?.date ?? event.endDate ?? event.startDate;
  const start = toIsoDate(addMonths(isoToDate(event.startDate), -12));
  const end = toIsoDate(addMonths(isoToDate(event.endDate ?? event.startDate), 18));

  return {
    start: start < first ? first : start,
    end: end > last ? last : end
  };
};

export const filterRowsByRange = (rows: HistoricalRow[], start: string, end: string) =>
  rows.filter((row) => row.date >= start && row.date <= end);

export const eventsInRange = (start: string, end: string) =>
  macroEvents.filter((event) => {
    const eventEnd = event.endDate ?? event.startDate;
    return event.startDate <= end && eventEnd >= start;
  });

const mean = (values: number[]) => {
  if (!values.length) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
};

const std = (values: number[]) => {
  if (values.length < 2) return null;
  const avg = mean(values);
  if (avg === null) return null;
  const variance = values.reduce((sum, value) => sum + (value - avg) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
};

const valueChangeMonths = (rows: HistoricalRow[], key: ResearchMaturityKey, lookbackMonths: number) => {
  const last = rows.filter((row) => typeof row[key] === "number").at(-1);
  if (!last || typeof last[key] !== "number") return null;

  const target = toIsoDate(addMonths(isoToDate(last.date), -lookbackMonths));
  const prior = [...rows]
    .reverse()
    .find((row) => row.date <= target && typeof row[key] === "number");

  return prior && typeof prior[key] === "number" ? (last[key] - prior[key]) * 100 : null;
};

export const buildStats = (rows: HistoricalRow[]) =>
  maturityKeys.map((key) => {
    const values = rows
      .map((row) => row[key])
      .filter((value): value is number => typeof value === "number");

    const changes = rows
      .map((row, index) => {
        if (index === 0) return null;
        const current = row[key];
        const prior = rows[index - 1][key];
        return typeof current === "number" && typeof prior === "number" ? (current - prior) * 100 : null;
      })
      .filter((value): value is number => typeof value === "number");

    const latest = values.at(-1) ?? null;
    const valuesBelow = latest === null ? 0 : values.filter((value) => value <= latest).length;

    return {
      key,
      latest,
      min: values.length ? Math.min(...values) : null,
      max: values.length ? Math.max(...values) : null,
      average: mean(values),
      annualizedVolBps: (() => {
        const dailyVol = std(changes);
        return dailyVol === null ? null : dailyVol * Math.sqrt(252);
      })(),
      oneMonthChangeBps: valueChangeMonths(rows, key, 1),
      threeMonthChangeBps: valueChangeMonths(rows, key, 3),
      oneYearChangeBps: valueChangeMonths(rows, key, 12),
      percentile: values.length && latest !== null ? (valuesBelow / values.length) * 100 : null,
      observations: values.length
    };
  });
