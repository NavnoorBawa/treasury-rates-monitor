export type DashboardMaturityKey = "2Y" | "5Y" | "10Y" | "30Y";

export type ResearchMaturityKey = "3M" | DashboardMaturityKey;

export type SpreadKey = "10Y2Y" | "30Y5Y" | "5Y2Y" | "10Y3M";

export type CacheStatus = "hit" | "refresh" | "stale";

export interface SummaryPoint {
  key: DashboardMaturityKey;
  label: string;
  shortLabel: string;
  field: string;
  years: number;
  value: number;
  previousValue: number;
  changeBps: number;
  changePct: number | null;
}

export interface CurvePoint {
  key: string;
  label: string;
  shortLabel: string;
  field: string;
  years: number;
  value: number;
  highlighted: boolean;
}

export interface HistoryPoint {
  date: string;
  value: number;
}

export interface SpreadPoint {
  key: string;
  label: string;
  valueBps: number;
  changeBps: number;
}

export interface TreasuryPayload {
  source: {
    name: string;
    pageUrl: string;
    feedUrl: string;
    recordDate: string;
    previousRecordDate: string;
    feedUpdatedAt: string | null;
    retrievedAt: string;
    historyWindowDays: number;
  };
  summary: SummaryPoint[];
  curve: CurvePoint[];
  history: Record<DashboardMaturityKey, HistoryPoint[]>;
  spreads: SpreadPoint[];
  cache: {
    status: CacheStatus;
    ttlSeconds: number;
    warning?: string;
  };
}

export interface HistoricalRow {
  date: string;
  "3M": number | null;
  "2Y": number | null;
  "5Y": number | null;
  "10Y": number | null;
  "30Y": number | null;
  "10Y2Y": number | null;
  "30Y5Y": number | null;
  "5Y2Y": number | null;
  "10Y3M": number | null;
}

export interface HistoricalPayload {
  source: {
    name: string;
    pageUrl: string;
    downloadUrl: string;
    primaryUse: string;
    retrievedAt: string;
    recordStartDate: string | null;
    recordEndDate: string | null;
    supplementalSource: string;
    note: string;
  };
  maturities: Array<{
    key: ResearchMaturityKey;
    label: string;
    shortLabel: string;
    years: number;
  }>;
  spreads: Array<{
    key: SpreadKey;
    label: string;
    longLabel: string;
    minuend: ResearchMaturityKey;
    subtrahend: ResearchMaturityKey;
  }>;
  availability: Record<
    ResearchMaturityKey,
    {
      firstDate: string | null;
      lastDate: string | null;
      observations: number;
    }
  >;
  rows: HistoricalRow[];
  cache: {
    status: CacheStatus;
    ttlSeconds: number;
    warning?: string;
  };
}
