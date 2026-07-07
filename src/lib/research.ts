import type { CoreCurveSpreadKey, DashboardMaturityKey, HistoricalRow, ResearchMaturityKey, SpreadKey } from "../types";

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

export const coreCurveSpreadKeys: CoreCurveSpreadKey[] = ["5Y2Y", "10Y2Y", "30Y2Y", "10Y5Y", "30Y5Y", "30Y10Y"];

export const spreadKeys: SpreadKey[] = [...coreCurveSpreadKeys, "10Y3M"];

export type CurveMoveType =
  | "Bull steepening"
  | "Bear steepening"
  | "Bull flattening"
  | "Bear flattening"
  | "Parallel shift higher"
  | "Parallel shift lower";

export interface CurvePair {
  key: CoreCurveSpreadKey;
  label: string;
  longLabel: string;
  shortKey: DashboardMaturityKey;
  longKey: DashboardMaturityKey;
}

export interface CurveMove {
  comparisonDate: string;
  shortDeltaBps: number;
  longDeltaBps: number;
  spreadDeltaBps: number;
  levelDeltaBps: number;
  type: CurveMoveType;
  rationale: string;
}

export interface CurvePairAnalysis {
  pair: CurvePair;
  currentSpreadBps: number | null;
  weekly: CurveMove | null;
  monthly: CurveMove | null;
}

export interface CurveMovementAnalysis {
  latestDate: string | null;
  latestRow: HistoricalRow | null;
  pairs: CurvePairAnalysis[];
  dominantWeekly: CurvePairAnalysis | null;
  dominantMonthly: CurvePairAnalysis | null;
  yearEndScenario: {
    title: string;
    description: string;
    confidence: "Low" | "Moderate";
    caveat: string;
  };
}

export const curvePairs: CurvePair[] = [
  { key: "5Y2Y", label: "5Y - 2Y", longLabel: "5Y minus 2Y", shortKey: "2Y", longKey: "5Y" },
  { key: "10Y2Y", label: "10Y - 2Y", longLabel: "10Y minus 2Y", shortKey: "2Y", longKey: "10Y" },
  { key: "30Y2Y", label: "30Y - 2Y", longLabel: "30Y minus 2Y", shortKey: "2Y", longKey: "30Y" },
  { key: "10Y5Y", label: "10Y - 5Y", longLabel: "10Y minus 5Y", shortKey: "5Y", longKey: "10Y" },
  { key: "30Y5Y", label: "30Y - 5Y", longLabel: "30Y minus 5Y", shortKey: "5Y", longKey: "30Y" },
  { key: "30Y10Y", label: "30Y - 10Y", longLabel: "30Y minus 10Y", shortKey: "10Y", longKey: "30Y" }
];

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
    description: "Cross-asset risk shock and policy liquidity response."
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
    description: "Growth shock from technology-bubble unwind and early-2000s easing cycle."
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

const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
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

const spreadChangeThresholdBps = 3;

const isNumber = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);

const hasPairValues = (row: HistoricalRow, pair: CurvePair) => isNumber(row[pair.shortKey]) && isNumber(row[pair.longKey]);

const currentSpreadForPair = (row: HistoricalRow, pair: CurvePair) => {
  const storedSpread = row[pair.key];
  if (isNumber(storedSpread)) return storedSpread;

  const longYield = row[pair.longKey];
  const shortYield = row[pair.shortKey];
  return isNumber(longYield) && isNumber(shortYield) ? (longYield - shortYield) * 100 : null;
};

const classifyCurveMove = (spreadDeltaBps: number, levelDeltaBps: number): CurveMoveType => {
  if (Math.abs(spreadDeltaBps) <= spreadChangeThresholdBps) {
    return levelDeltaBps >= 0 ? "Parallel shift higher" : "Parallel shift lower";
  }

  if (spreadDeltaBps > 0) {
    return levelDeltaBps >= 0 ? "Bear steepening" : "Bull steepening";
  }

  return levelDeltaBps >= 0 ? "Bear flattening" : "Bull flattening";
};

const movementRationale = (type: CurveMoveType, pair: CurvePair) => {
  const segment = `${pair.longKey}/${pair.shortKey}`;

  switch (type) {
    case "Bear steepening":
      return `${segment} steepened because the long tenor rose relative to the front tenor. This usually points to inflation, term-premium, duration-supply, or long-run policy repricing pressure.`;
    case "Bull steepening":
      return `${segment} steepened while the average yield level fell. This usually points to front-end rallying faster as policy-cut or growth-risk expectations move lower.`;
    case "Bear flattening":
      return `${segment} flattened while the average yield level rose. This usually points to the front tenor selling off more as near-term policy expectations tighten.`;
    case "Bull flattening":
      return `${segment} flattened while the average yield level fell. This usually points to stronger long-end demand, lower long-run growth/inflation expectations, or risk-off duration buying.`;
    case "Parallel shift higher":
      return `${segment} moved mostly in parallel with yields higher. Curve shape changed little; the main signal is a broad upward repricing in rates.`;
    case "Parallel shift lower":
      return `${segment} moved mostly in parallel with yields lower. Curve shape changed little; the main signal is a broad rates rally.`;
  }
};

const buildMoveForPair = (rows: HistoricalRow[], latest: HistoricalRow, pair: CurvePair, targetDate: string): CurveMove | null => {
  const currentLong = latest[pair.longKey];
  const currentShort = latest[pair.shortKey];
  const currentSpread = currentSpreadForPair(latest, pair);

  if (!isNumber(currentLong) || !isNumber(currentShort) || !isNumber(currentSpread)) return null;

  const prior = [...rows]
    .reverse()
    .find((row) => row.date <= targetDate && hasPairValues(row, pair));

  if (!prior) return null;

  const priorLong = prior[pair.longKey];
  const priorShort = prior[pair.shortKey];
  const priorSpread = currentSpreadForPair(prior, pair);

  if (!isNumber(priorLong) || !isNumber(priorShort) || !isNumber(priorSpread)) return null;

  const longDeltaBps = (currentLong - priorLong) * 100;
  const shortDeltaBps = (currentShort - priorShort) * 100;
  const spreadDeltaBps = currentSpread - priorSpread;
  const levelDeltaBps = (longDeltaBps + shortDeltaBps) / 2;
  const type = classifyCurveMove(spreadDeltaBps, levelDeltaBps);

  return {
    comparisonDate: prior.date,
    shortDeltaBps,
    longDeltaBps,
    spreadDeltaBps,
    levelDeltaBps,
    type,
    rationale: movementRationale(type, pair)
  };
};

const mostActivePair = (pairs: CurvePairAnalysis[], horizon: "weekly" | "monthly") =>
  pairs.reduce<CurvePairAnalysis | null>((current, pair) => {
    const move = pair[horizon];
    if (!move) return current;
    if (!current?.[horizon]) return pair;
    return Math.abs(move.spreadDeltaBps) > Math.abs(current[horizon].spreadDeltaBps) ? pair : current;
  }, null);

const buildYearEndScenario = (pairs: CurvePairAnalysis[], latestDate: string | null): CurveMovementAnalysis["yearEndScenario"] => {
  const tensTwos = pairs.find((pair) => pair.pair.key === "10Y2Y");
  const fivesTwos = pairs.find((pair) => pair.pair.key === "5Y2Y");
  const thirtiesFives = pairs.find((pair) => pair.pair.key === "30Y5Y");
  const current10Y2Y = tensTwos?.currentSpreadBps;
  const monthly10Y2Y = tensTwos?.monthly?.spreadDeltaBps;
  const monthly5Y2Y = fivesTwos?.monthly?.spreadDeltaBps;
  const monthly30Y5Y = thirtiesFives?.monthly?.spreadDeltaBps;

  if (!isNumber(current10Y2Y) || !isNumber(monthly10Y2Y)) {
    return {
      title: "Year-end scenario: insufficient curve history",
      description:
        "The dashboard needs valid 2Y, 5Y, 10Y, and 30Y observations before it can form a rule-based year-end curve scenario.",
      confidence: "Low",
      caveat: "Scenario analysis only; this is not a point forecast or investment recommendation."
    };
  }

  const frontEndConfirmation = isNumber(monthly5Y2Y) ? monthly5Y2Y : monthly10Y2Y;
  const longEndConfirmation = isNumber(monthly30Y5Y) ? monthly30Y5Y : monthly10Y2Y;
  const curveState =
    current10Y2Y < -10 ? "inverted" : current10Y2Y <= 10 ? "near flat" : "positively sloped";
  const broadSteepening = monthly10Y2Y > 5 && frontEndConfirmation > 0;
  const broadFlattening = monthly10Y2Y < -5 && frontEndConfirmation < 0;
  const longEndSteepening = longEndConfirmation > 5;

  if (broadSteepening && current10Y2Y < 0) {
    return {
      title: "Year-end scenario: de-inversion / gradual steepening bias",
      description: `As of ${latestDate ?? "the latest observation"}, 10Y-2Y is ${current10Y2Y.toFixed(
        1
      )} bps and has steepened ${monthly10Y2Y.toFixed(
        1
      )} bps over roughly one month. The rule-based read is that the curve has been moving toward de-inversion; if that momentum persists, year-end risk skews toward a less inverted or modestly positive curve.`,
      confidence: longEndSteepening ? "Moderate" : "Low",
      caveat:
        "Scenario analysis only. The path depends on incoming inflation data, Fed reaction function, Treasury supply, and term-premium repricing."
    };
  }

  if (broadSteepening) {
    return {
      title: "Year-end scenario: additional steepening bias",
      description: `The curve is currently ${curveState}, and the 10Y-2Y spread widened ${monthly10Y2Y.toFixed(
        1
      )} bps over roughly one month. The rule-based read favors continued steepening unless front-end policy expectations or long-end term premium reverse.`,
      confidence: longEndSteepening ? "Moderate" : "Low",
      caveat:
        "Scenario analysis only. This is a curve-shape read from observed Treasury data, not a tradable rate forecast."
    };
  }

  if (broadFlattening) {
    return {
      title: "Year-end scenario: flattening risk remains active",
      description: `The curve is currently ${curveState}, and the 10Y-2Y spread narrowed ${Math.abs(monthly10Y2Y).toFixed(
        1
      )} bps over roughly one month. The rule-based read is that the curve is still absorbing front-end or policy-rate pressure; year-end steepening would require a reversal in that momentum.`,
      confidence: "Low",
      caveat:
        "Scenario analysis only. The path can change quickly around inflation releases, Fed communication, and long-end auction/term-premium shocks."
    };
  }

  return {
    title: "Year-end scenario: range-bound curve bias",
    description: `The curve is currently ${curveState}, with 10Y-2Y at ${current10Y2Y.toFixed(
      1
    )} bps and only ${monthly10Y2Y.toFixed(
      1
    )} bps of one-month spread movement. The rule-based read is that curve direction is not yet decisive; year-end shape depends on whether the next dominant impulse comes from front-end Fed expectations or long-end term premium.`,
    confidence: "Low",
    caveat: "Scenario analysis only. It should be read as a structured hypothesis, not a point forecast."
  };
};

export const buildCurveMovementAnalysis = (rows: HistoricalRow[]): CurveMovementAnalysis => {
  const latestRow = [...rows].reverse().find((row) => curvePairs.every((pair) => hasPairValues(row, pair))) ?? null;
  const latestDate = latestRow?.date ?? null;

  if (!latestRow || !latestDate) {
    return {
      latestDate,
      latestRow,
      pairs: curvePairs.map((pair) => ({
        pair,
        currentSpreadBps: null,
        weekly: null,
        monthly: null
      })),
      dominantWeekly: null,
      dominantMonthly: null,
      yearEndScenario: buildYearEndScenario([], latestDate)
    };
  }

  const weekTarget = toIsoDate(addDays(isoToDate(latestDate), -7));
  const monthTarget = toIsoDate(addMonths(isoToDate(latestDate), -1));
  const rowsBeforeLatest = rows.filter((row) => row.date < latestDate);
  const pairs = curvePairs.map((pair) => ({
    pair,
    currentSpreadBps: currentSpreadForPair(latestRow, pair),
    weekly: buildMoveForPair(rowsBeforeLatest, latestRow, pair, weekTarget),
    monthly: buildMoveForPair(rowsBeforeLatest, latestRow, pair, monthTarget)
  }));

  return {
    latestDate,
    latestRow,
    pairs,
    dominantWeekly: mostActivePair(pairs, "weekly"),
    dominantMonthly: mostActivePair(pairs, "monthly"),
    yearEndScenario: buildYearEndScenario(pairs, latestDate)
  };
};

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
