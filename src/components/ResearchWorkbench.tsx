import { useEffect, useMemo, useState, type KeyboardEvent } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import {
  CalendarRange,
  ChartNoAxesCombined,
  Download,
  Focus,
  GitCompareArrows,
  History,
  Info,
  Layers3,
  RotateCcw
} from "lucide-react";
import { CurveMatrix } from "./CurveMatrix";
import { CurveRegimeTimeline } from "./CurveRegimeTimeline";
import { LoadingBlock } from "./LoadingBlock";
import { YieldCurveChart } from "./YieldCurveChart";
import { YieldCurveComparison } from "./YieldCurveComparison";
import { useHistoricalYields } from "../hooks/useHistoricalYields";
import { formatBps, formatDate, formatShortDate, formatTimestamp, formatYield } from "../lib/format";
import {
  buildStats,
  curvePairs,
  eventsInRange,
  filterRowsByRange,
  getComparisonTargetDate,
  getEventFocusRange,
  getPresetRange,
  maturityKeys,
  rangePresetLabels,
  spreadKeys,
  type CurveMoveHorizon,
  type MacroEvent,
  type RangePreset
} from "../lib/research";
import type { ResearchMaturityKey, SpreadKey, TreasuryPayload } from "../types";

type WorkspaceTab = "snapshot" | "comparison" | "history" | "regimes";
type HistoryView = "charts" | "events" | "statistics";

const rangePresets: Array<Exclude<RangePreset, "CUSTOM">> = ["1Y", "5Y", "10Y", "20Y", "MAX"];

const workspaceTabs: Array<{ id: WorkspaceTab; label: string; description: string; icon: typeof ChartNoAxesCombined }> = [
  { id: "snapshot", label: "Market", description: "Official CMT", icon: ChartNoAxesCombined },
  { id: "comparison", label: "Compare", description: "Date to date", icon: GitCompareArrows },
  { id: "history", label: "History", description: "Rates and events", icon: History },
  { id: "regimes", label: "Regimes", description: "Curve movement", icon: Layers3 }
];

const historyViews: Array<{ id: HistoryView; label: string }> = [
  { id: "charts", label: "Rates & spreads" },
  { id: "events", label: "Event studies" },
  { id: "statistics", label: "Statistics" }
];

const getAdjacentTab = <T extends string>(items: T[], current: T, key: string) => {
  const currentIndex = items.indexOf(current);
  if (currentIndex < 0) return null;

  if (key === "Home") return items[0];
  if (key === "End") return items.at(-1) ?? null;
  if (key !== "ArrowLeft" && key !== "ArrowRight") return null;

  const offset = key === "ArrowRight" ? 1 : -1;
  return items[(currentIndex + offset + items.length) % items.length];
};

const yieldColors: Record<ResearchMaturityKey, string> = {
  "2Y": "var(--series-2y)",
  "5Y": "var(--series-5y)",
  "10Y": "var(--series-10y)",
  "30Y": "var(--series-30y)"
};

const spreadColors: Record<SpreadKey, string> = {
  "5Y2Y": "var(--series-5y)",
  "10Y2Y": "var(--series-2y)",
  "30Y2Y": "var(--series-30y)",
  "10Y5Y": "var(--series-10y)",
  "30Y5Y": "var(--series-30y)",
  "30Y10Y": "var(--series-30y)"
};

interface MultiTooltipProps {
  active?: boolean;
  label?: string;
  payload?: Array<{
    dataKey?: string;
    name?: string;
    value?: number | null;
    color?: string;
  }>;
  unit: "yield" | "bps";
}

function MultiTooltip({ active, label, payload, unit }: MultiTooltipProps) {
  if (!active || !payload?.length) return null;

  return (
    <div className="chart-tooltip chart-tooltip--wide">
      <span className="chart-tooltip__label">{formatShortDate(label)}</span>
      <div className="chart-tooltip__rows">
        {payload
          .filter((item) => typeof item.value === "number")
          .map((item) => (
            <div className="chart-tooltip__row" key={item.dataKey}>
              <span>
                <i style={{ backgroundColor: item.color }} />
                {item.name ?? item.dataKey}
              </span>
              <strong>{unit === "yield" ? formatYield(item.value) : formatBps(item.value)}</strong>
            </div>
          ))}
      </div>
    </div>
  );
}

const compactDateTick = (date: string) => {
  const value = new Date(`${date}T00:00:00Z`);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    year: "2-digit",
    timeZone: "UTC"
  }).format(value);
};

const formatStat = (value: number | null | undefined, mode: "yield" | "bps" | "signedBps" | "pct" = "yield") => {
  if (value === null || value === undefined || Number.isNaN(value)) return "n/a";
  if (mode === "bps") return `${value.toFixed(1)} bps`;
  if (mode === "signedBps") return formatBps(value);
  if (mode === "pct") return `${value.toFixed(0)}%`;
  return formatYield(value);
};

const eventClass = (event: MacroEvent) => `event-card event-card--${event.category.toLowerCase()}`;

const csvEscape = (value: string | number | null | undefined) => {
  if (value === null || value === undefined) return "";
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
};

const csvNumber = (value: number | null | undefined) =>
  value === null || value === undefined || Number.isNaN(value) ? "" : value.toFixed(3);

interface ResearchWorkbenchProps {
  currentData?: TreasuryPayload;
  currentLoading: boolean;
}

export function ResearchWorkbench({ currentData, currentLoading }: ResearchWorkbenchProps) {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("snapshot");
  const [historyView, setHistoryView] = useState<HistoryView>("charts");
  const shouldLoadHistory = activeTab !== "snapshot";
  const { data, error, isLoading } = useHistoricalYields(shouldLoadHistory);
  const [preset, setPreset] = useState<RangePreset>("10Y");
  const [range, setRange] = useState({ start: "", end: "" });
  const [selectedSpread, setSelectedSpread] = useState<SpreadKey>("10Y2Y");
  const [selectedPairKey, setSelectedPairKey] = useState<SpreadKey>("10Y2Y");
  const [regimeHorizon, setRegimeHorizon] = useState<CurveMoveHorizon>("1M");
  const [comparisonAsOf, setComparisonAsOf] = useState("");
  const [comparisonReference, setComparisonReference] = useState("");

  useEffect(() => {
    if (!data?.rows.length) return;
    const latestDate = data.rows.at(-1)?.date ?? "";

    if (!range.start || !range.end) {
      setRange(getPresetRange("10Y", data.rows));
    }
    if (!comparisonAsOf) {
      setComparisonAsOf(latestDate);
    }
    if (!comparisonReference && latestDate) {
      setComparisonReference(getComparisonTargetDate(latestDate, "1Y"));
    }
  }, [comparisonAsOf, comparisonReference, data?.rows, range.end, range.start]);

  const selectedRows = useMemo(() => {
    if (!data?.rows.length || !range.start || !range.end) return [];
    return filterRowsByRange(data.rows, range.start, range.end);
  }, [data?.rows, range.end, range.start]);

  const visibleEvents = useMemo(() => {
    if (!range.start || !range.end) return [];
    return eventsInRange(range.start, range.end);
  }, [range.end, range.start]);

  const statsReferenceRows = useMemo(() => {
    if (!data?.rows.length || !range.end) return selectedRows;
    return data.rows.filter((row) => row.date <= range.end);
  }, [data?.rows, range.end, selectedRows]);
  const stats = useMemo(() => buildStats(selectedRows, statsReferenceRows), [selectedRows, statsReferenceRows]);

  const selectedSpreadMeta = data?.spreads.find((spread) => spread.key === selectedSpread);
  const selectedPair = curvePairs.find((pair) => pair.key === selectedPairKey) ?? curvePairs[1];

  const setPresetRange = (nextPreset: Exclude<RangePreset, "CUSTOM">) => {
    if (!data?.rows.length) return;
    setPreset(nextPreset);
    setRange(getPresetRange(nextPreset, data.rows));
  };

  const onCustomDateChange = (field: "start" | "end", value: string) => {
    setPreset("CUSTOM");
    setRange((current) => ({ ...current, [field]: value }));
  };

  const focusEvent = (event: MacroEvent) => {
    if (!data?.rows.length) return;
    setPreset("CUSTOM");
    setRange(getEventFocusRange(event, data.rows));
    setHistoryView("charts");
  };

  const setComparisonHorizon = (horizon: "1W" | "1M" | "1Y" | "RANGE") => {
    if (!data?.rows.length) return;
    const asOf = comparisonAsOf || data.rows.at(-1)?.date;
    if (!asOf) return;
    setComparisonAsOf(asOf);
    if (horizon === "RANGE") {
      setComparisonReference(range.start || getComparisonTargetDate(asOf, "1Y"));
      return;
    }
    setComparisonReference(getComparisonTargetDate(asOf, horizon));
  };

  const handleWorkspaceTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>, current: WorkspaceTab) => {
    const next = getAdjacentTab(workspaceTabs.map((tab) => tab.id), current, event.key);
    if (!next) return;

    event.preventDefault();
    setActiveTab(next);
    requestAnimationFrame(() => document.getElementById(`workspace-tab-${next}`)?.focus());
  };

  const handleHistoryViewKeyDown = (event: KeyboardEvent<HTMLButtonElement>, current: HistoryView) => {
    const next = getAdjacentTab(historyViews.map((view) => view.id), current, event.key);
    if (!next) return;

    event.preventDefault();
    setHistoryView(next);
    requestAnimationFrame(() => document.getElementById(`history-view-tab-${next}`)?.focus());
  };

  const downloadSelectedCurveData = () => {
    if (!selectedRows.length) return;
    const headers = ["date", "2Y", "5Y", "10Y", "30Y", ...curvePairs.map((pair) => pair.label)];
    const body = selectedRows.map((row) => [
      row.date,
      csvNumber(row["2Y"]),
      csvNumber(row["5Y"]),
      csvNumber(row["10Y"]),
      csvNumber(row["30Y"]),
      ...curvePairs.map((pair) => csvNumber(row[pair.key]))
    ]);
    const csv = [headers.map(csvEscape).join(","), ...body.map((cells) => cells.map(csvEscape).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `treasury-curve-${range.start || "start"}-${range.end || "end"}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const renderResearchControls = () => (
    <div className="research-controls">
      <div className="segmented-control" aria-label="Date range presets">
        {rangePresets.map((item) => (
          <button
            className={preset === item ? "segmented-control__button segmented-control__button--active" : "segmented-control__button"}
            type="button"
            key={item}
            aria-pressed={preset === item}
            onClick={() => setPresetRange(item)}
          >
            {rangePresetLabels[item]}
          </button>
        ))}
      </div>
      <div className="date-controls">
        <CalendarRange size={16} aria-hidden="true" />
        <label>
          <span>From</span>
          <input type="date" value={range.start} min={data?.source.recordStartDate ?? undefined} max={range.end || data?.source.recordEndDate || undefined} onChange={(event) => onCustomDateChange("start", event.target.value)} />
        </label>
        <label>
          <span>To</span>
          <input type="date" value={range.end} min={range.start || data?.source.recordStartDate || undefined} max={data?.source.recordEndDate ?? undefined} onChange={(event) => onCustomDateChange("end", event.target.value)} />
        </label>
        <button className="text-button" type="button" onClick={() => setPresetRange("10Y")}>
          <RotateCcw size={15} aria-hidden="true" />
          Reset
        </button>
        <button className="text-button" type="button" disabled={!selectedRows.length} onClick={downloadSelectedCurveData}>
          <Download size={15} aria-hidden="true" />
          CSV
        </button>
      </div>
    </div>
  );

  const renderHistoryCharts = () => {
    if (!selectedRows.length) return <div className="empty-state">No valid Treasury observations are available inside the selected date window.</div>;

    return (
      <div className="research-grid">
        <article className="panel research-chart-panel research-chart-panel--wide">
          <div className="panel__header">
            <div>
              <p className="eyebrow">Yields</p>
              <h3>Nominal Constant Maturity Yields</h3>
            </div>
            <span className="panel__meta">{selectedRows.length.toLocaleString()} selected observations</span>
          </div>
          <div className="research-chart">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={selectedRows} margin={{ top: 12, right: 18, bottom: 6, left: -6 }}>
                <CartesianGrid vertical={false} stroke="var(--chart-grid)" strokeDasharray="3 6" />
                <XAxis dataKey="date" minTickGap={42} tickFormatter={compactDateTick} tickLine={false} axisLine={false} tick={{ fill: "var(--muted)", fontSize: 12 }} />
                <YAxis tickLine={false} axisLine={false} width={50} domain={["dataMin - 0.35", "dataMax + 0.35"]} tickFormatter={(value) => `${Number(value).toFixed(1)}%`} tick={{ fill: "var(--muted)", fontSize: 12 }} />
                <Tooltip content={<MultiTooltip unit="yield" />} />
                <Legend verticalAlign="top" align="right" iconType="plainline" wrapperStyle={{ color: "var(--muted)" }} />
                {visibleEvents.map((event) => <ReferenceLine key={event.id} x={event.startDate} stroke="var(--event-line)" strokeDasharray="4 6" ifOverflow="extendDomain" />)}
                {maturityKeys.map((key) => <Line key={key} type="linear" dataKey={key} name={key} connectNulls={false} dot={false} stroke={yieldColors[key]} strokeWidth={key === "10Y" ? 2.4 : 1.8} isAnimationActive={false} />)}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="panel research-chart-panel">
          <div className="panel__header">
            <div>
              <p className="eyebrow">Curve measures</p>
              <h3>{selectedSpreadMeta?.longLabel ?? selectedSpread}</h3>
            </div>
          </div>
          <div className="spread-selector" aria-label="Spread selector">
            {spreadKeys.map((key) => {
              const spread = data?.spreads.find((item) => item.key === key);
              return (
                <button className={selectedSpread === key ? "spread-selector__button spread-selector__button--active" : "spread-selector__button"} type="button" key={key} aria-pressed={selectedSpread === key} onClick={() => setSelectedSpread(key)}>
                  {spread?.label ?? key}
                </button>
              );
            })}
          </div>
          <div className="spread-chart">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={selectedRows} margin={{ top: 10, right: 14, bottom: 4, left: -10 }}>
                <defs>
                  <linearGradient id="spread-gradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={spreadColors[selectedSpread]} stopOpacity={0.22} />
                    <stop offset="100%" stopColor={spreadColors[selectedSpread]} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="var(--chart-grid)" strokeDasharray="3 6" />
                <XAxis dataKey="date" minTickGap={32} tickFormatter={compactDateTick} tickLine={false} axisLine={false} tick={{ fill: "var(--muted)", fontSize: 11 }} />
                <YAxis tickLine={false} axisLine={false} width={48} tickFormatter={(value) => `${Number(value).toFixed(0)}`} tick={{ fill: "var(--muted)", fontSize: 11 }} />
                <Tooltip content={<MultiTooltip unit="bps" />} />
                <ReferenceLine y={0} stroke="var(--zero-line)" strokeDasharray="4 5" />
                <Area type="linear" dataKey={selectedSpread} name={selectedSpreadMeta?.label ?? selectedSpread} stroke={spreadColors[selectedSpread]} strokeWidth={2} fill="url(#spread-gradient)" dot={false} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="spread-note">
            <Info size={15} aria-hidden="true" />
            <span>Spreads are shown in basis points. Values below zero indicate inversion. Business-day observations only; weekends and market holidays are omitted.</span>
          </div>
        </article>
      </div>
    );
  };

  const renderEvents = () => (
    <div className="event-section">
      <div className="section-header section-header--compact">
        <div>
          <p className="eyebrow">Event study</p>
          <h2>Macro and Methodology Markers</h2>
        </div>
        <span>{visibleEvents.length} events in selected window</span>
      </div>
      <div className="event-rail">
        {visibleEvents.length ? visibleEvents.map((event) => (
          <button className={eventClass(event)} type="button" key={event.id} onClick={() => focusEvent(event)}>
            <span>{event.category}</span>
            <strong>{event.title}</strong>
            <small>{formatDate(event.startDate)}{event.endDate ? ` - ${formatDate(event.endDate)}` : ""}</small>
            <em>{event.description}</em>
            <i><Focus size={14} aria-hidden="true" />Focus charts</i>
          </button>
        )) : <div className="empty-state">No configured event markers fall inside the selected range.</div>}
      </div>
    </div>
  );

  const renderStatistics = () => (
    <article className="panel stats-panel">
      <div className="panel__header">
        <div>
          <p className="eyebrow">Selected-period analytics</p>
          <h3>Yield Statistics and Momentum</h3>
        </div>
        <span className="panel__meta">Window end {range.end ? formatDate(range.end) : "n/a"} · Retrieved {formatTimestamp(data?.source.retrievedAt)}</span>
      </div>
      <div className="stats-table-wrap">
        <table className="stats-table">
          <thead><tr><th>Maturity</th><th>Latest</th><th>Min</th><th>Max</th><th>Average</th><th>Ann. vol</th><th>1M Δ</th><th>3M Δ</th><th>1Y Δ</th><th>Empirical pct.</th></tr></thead>
          <tbody>
            {stats.map((row) => (
              <tr key={row.key}>
                <th>{row.key}</th><td>{formatStat(row.latest)}</td><td>{formatStat(row.min)}</td><td>{formatStat(row.max)}</td><td>{formatStat(row.average)}</td><td>{formatStat(row.annualizedVolBps, "bps")}</td><td>{formatStat(row.oneMonthChangeBps, "signedBps")}</td><td>{formatStat(row.threeMonthChangeBps, "signedBps")}</td><td>{formatStat(row.oneYearChangeBps, "signedBps")}</td><td>{formatStat(row.percentile, "pct")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="source-footnote">
        <span>{data?.source.name}</span>
        <span>{data?.source.supplementalSource}</span>
        <span>{data?.source.note}</span>
        <span>Observed business days only. Weekend, federal-market-holiday, and source `ND` values are not imputed.</span>
        <span>Min, max, average, volatility, and empirical percentile use the selected range. 1M, 3M, and 1Y changes use the nearest valid observation on or before each calendar lookback, including an observation just before the visible range; a value is shown only when that observation is within 10 calendar days of the target date.</span>
        <span>Annualized volatility is the sample standard deviation of business-day yield changes multiplied by sqrt(252).</span>
      </div>
    </article>
  );

  return (
    <section className="workspace-shell" aria-label="Treasury research workspace">
      <div className="workspace-tabs" role="tablist" aria-label="Treasury dashboard views" aria-orientation="horizontal">
        {workspaceTabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              id={`workspace-tab-${tab.id}`}
              className={activeTab === tab.id ? "workspace-tab workspace-tab--active" : "workspace-tab"}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`workspace-panel-${tab.id}`}
              tabIndex={activeTab === tab.id ? 0 : -1}
              onClick={() => setActiveTab(tab.id)}
              onKeyDown={(event) => handleWorkspaceTabKeyDown(event, tab.id)}
            >
              <Icon size={17} aria-hidden="true" />
              <span><strong>{tab.label}</strong><small>{tab.description}</small></span>
            </button>
          );
        })}
      </div>

      {activeTab === "snapshot" ? (
        <div id="workspace-panel-snapshot" role="tabpanel" aria-labelledby="workspace-tab-snapshot" tabIndex={0} className="workspace-panel workspace-panel--snapshot">
          <div className="dashboard-grid dashboard-grid--workspace">
            {currentData ? <YieldCurveChart data={currentData.curve} recordDate={currentData.source.recordDate} /> : <LoadingBlock className="panel panel--curve" rows={6} />}
            {currentData ? <CurveMatrix data={currentData} /> : <LoadingBlock className="panel panel--curve-matrix" rows={6} />}
          </div>
          <div className="workspace-source-strip">
            <span>Current values are official Treasury CMT par yields, observed near 3:30 PM ET on business days.</span>
            <span>{currentLoading ? "Refreshing current feed" : currentData ? `Official CMT ${formatDate(currentData.source.recordDate)}` : "Current feed unavailable"}</span>
          </div>
        </div>
      ) : isLoading || !data ? (
        <div className="workspace-panel" role="tabpanel" id={`workspace-panel-${activeTab}`} aria-labelledby={`workspace-tab-${activeTab}`} tabIndex={0}>
          {error ? <div className="notice" role="alert"><strong>Unable to load long-run historical data.</strong><span>{error instanceof Error ? error.message : "Please retry in a moment."}</span></div> : <LoadingBlock className="panel" rows={7} />}
        </div>
      ) : (
        <div className="workspace-panel" role="tabpanel" id={`workspace-panel-${activeTab}`} aria-labelledby={`workspace-tab-${activeTab}`} tabIndex={0}>
          <div className="research-header research-header--workspace">
            <div>
              <p className="eyebrow">Macro research layer</p>
              <h2>{activeTab === "comparison" ? "Historical Yield Curve Comparison" : activeTab === "regimes" ? "Curve Movement Regimes" : "Historical Treasury Regime Analysis"}</h2>
              <p>{activeTab === "comparison" ? "Compare complete Treasury curves from any two official business-day observations." : activeTab === "regimes" ? "Date-to-date two-tenor curve decomposition with completed calendar-period regime history." : "Analyze rates, spreads, event windows, and statistical behavior without leaving the workspace."}</p>
            </div>
            <div className="research-source"><span>History: {formatDate(data.source.recordStartDate)} - {formatDate(data.source.recordEndDate)}</span><strong>{data.rows.length.toLocaleString()} daily records</strong></div>
          </div>

          {activeTab === "comparison" ? (
            <>
              <div className="comparison-shortcuts" aria-label="Comparison date shortcuts">
                <span>Reference window</span>
                {(["1W", "1M", "1Y", "RANGE"] as const).map((item) => <button key={item} type="button" onClick={() => setComparisonHorizon(item)}>{item === "RANGE" ? "Range start" : item}</button>)}
              </div>
              <YieldCurveComparison rows={data.rows} asOfDate={comparisonAsOf} referenceDate={comparisonReference} onAsOfDateChange={setComparisonAsOf} onReferenceDateChange={setComparisonReference} />
            </>
          ) : null}

          {activeTab === "history" || activeTab === "regimes" ? renderResearchControls() : null}

          {activeTab === "history" ? (
            <>
              <div className="research-subtabs" role="tablist" aria-label="Historical research panels" aria-orientation="horizontal">
                {historyViews.map((view) => (
                  <button
                    id={`history-view-tab-${view.id}`}
                    key={view.id}
                    className={historyView === view.id ? "research-subtab research-subtab--active" : "research-subtab"}
                    type="button"
                    role="tab"
                    aria-selected={historyView === view.id}
                    aria-controls={`history-view-panel-${view.id}`}
                    tabIndex={historyView === view.id ? 0 : -1}
                    onClick={() => setHistoryView(view.id)}
                    onKeyDown={(event) => handleHistoryViewKeyDown(event, view.id)}
                  >
                    {view.label}
                  </button>
                ))}
              </div>
              <div id={`history-view-panel-${historyView}`} role="tabpanel" aria-labelledby={`history-view-tab-${historyView}`} tabIndex={0}>
                {historyView === "charts" ? renderHistoryCharts() : historyView === "events" ? renderEvents() : renderStatistics()}
              </div>
            </>
          ) : null}

          {activeTab === "regimes" ? (
            <>
              <div className="regime-controls">
                <div className="regime-control-group">
                  <span className="regime-control-group__label">Curve segment</span>
                  <div className="spread-selector" aria-label="Curve segment selector">
                    {curvePairs.map((pair) => <button className={selectedPairKey === pair.key ? "spread-selector__button spread-selector__button--active" : "spread-selector__button"} type="button" key={pair.key} aria-pressed={selectedPairKey === pair.key} onClick={() => setSelectedPairKey(pair.key)}>{pair.label}</button>)}
                  </div>
                </div>
                <div className="regime-control-group regime-control-group--horizon">
                  <span className="regime-control-group__label">Historical interval</span>
                  <div className="segmented-control segmented-control--compact" aria-label="Curve movement horizon">
                    {(["1W", "1M"] as CurveMoveHorizon[]).map((horizon) => <button className={regimeHorizon === horizon ? "segmented-control__button segmented-control__button--active" : "segmented-control__button"} type="button" key={horizon} aria-pressed={regimeHorizon === horizon} onClick={() => setRegimeHorizon(horizon)}>{horizon === "1W" ? "Weekly" : "Monthly"}</button>)}
                  </div>
                </div>
              </div>
              {range.start && range.end ? <CurveRegimeTimeline rows={data.rows} pair={selectedPair} startDate={range.start} endDate={range.end} horizon={regimeHorizon} /> : <div className="empty-state">Select a date range to map curve movement.</div>}
            </>
          ) : null}
        </div>
      )}
    </section>
  );
}
