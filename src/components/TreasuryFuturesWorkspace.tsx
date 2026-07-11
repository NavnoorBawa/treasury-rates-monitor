import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import {
  ArrowDownRight,
  ArrowUpRight,
  Clock3,
  ExternalLink,
  Info,
  RefreshCw
} from "lucide-react";
import { useTreasuryFutures } from "../hooks/useTreasuryFutures";
import type { DashboardMaturityKey, FuturesInstrument, FuturesSeriesPoint } from "../types";
import { LoadingBlock } from "./LoadingBlock";

const maturityColors: Record<DashboardMaturityKey, string> = {
  "2Y": "var(--series-2y)",
  "5Y": "var(--series-5y)",
  "10Y": "var(--series-10y)",
  "30Y": "var(--series-30y)"
};

const formatPrice = (value: number | null | undefined) =>
  typeof value === "number" && Number.isFinite(value) ? value.toFixed(5) : "n/a";

const formatSigned = (value: number, decimals = 2) =>
  `${value > 0 ? "+" : ""}${value.toFixed(decimals)}`;

const formatVolume = (value: number | null) => {
  if (value === null) return "n/a";
  return new Intl.NumberFormat("en-US", {
    notation: value >= 100_000 ? "compact" : "standard",
    maximumFractionDigits: value >= 100_000 ? 2 : 0
  }).format(value);
};

const formatExchangeTime = (value: string | number | null, includeDate = true) => {
  if (value === null) return "n/a";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "n/a";

  return new Intl.DateTimeFormat("en-US", {
    ...(includeDate ? { month: "short", day: "numeric" } : {}),
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/New_York",
    timeZoneName: "short"
  }).format(date);
};

const formatChartTick = (timestamp: number) => {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/New_York"
  }).format(new Date(timestamp));
};

const contractMonth = (name: string) => {
  const match = name.match(/,([A-Za-z]{3})-(\d{4})$/);
  return match ? `${match[1]} ${match[2]}` : "Front continuous";
};

interface FuturesTooltipProps {
  active?: boolean;
  label?: number;
  payload?: Array<{
    value?: number;
    payload?: FuturesSeriesPoint;
  }>;
  previousClose: number;
}

function FuturesTooltip({ active, label, payload, previousClose }: FuturesTooltipProps) {
  const price = payload?.[0]?.payload?.price ?? payload?.[0]?.value;
  if (!active || typeof price !== "number" || typeof label !== "number") return null;
  const moveThirtySeconds = (price - previousClose) * 32;

  return (
    <div className="chart-tooltip chart-tooltip--futures">
      <span className="chart-tooltip__label">{formatExchangeTime(label)}</span>
      <div className="chart-tooltip__row">
        <span>Price</span>
        <strong>{formatPrice(price)}</strong>
      </div>
      <div className="chart-tooltip__row">
        <span>vs prior close</span>
        <strong>{formatSigned(moveThirtySeconds)} /32</strong>
      </div>
    </div>
  );
}

const rateDirectionLabel = (instrument: FuturesInstrument) => {
  if (instrument.rateDirection === "higher") return "Yield bias higher";
  if (instrument.rateDirection === "lower") return "Yield bias lower";
  return "Yield bias unchanged";
};

export function TreasuryFuturesWorkspace() {
  const [selectedSymbol, setSelectedSymbol] = useState<FuturesInstrument["symbol"]>("ZN=F");
  const { data, error, isFetching, isLoading, refetch } = useTreasuryFutures("1D");
  const selected = data?.instruments.find((instrument) => instrument.symbol === selectedSymbol)
    ?? data?.instruments[0];

  useEffect(() => {
    if (data?.instruments.length && !data.instruments.some((instrument) => instrument.symbol === selectedSymbol)) {
      setSelectedSymbol(data.instruments[0].symbol);
    }
  }, [data?.instruments, selectedSymbol]);

  const chartDomain = useMemo<[number, number]>(() => {
    if (!selected?.series.length) return [0, 1];
    const prices = selected.series.map((point) => point.price);
    prices.push(selected.previousClose);
    const minimum = Math.min(...prices);
    const maximum = Math.max(...prices);
    const padding = Math.max((maximum - minimum) * 0.12, selected.minTick * 2);
    return [minimum - padding, maximum + padding];
  }, [selected]);

  if (isLoading && !data) {
    return (
      <div className="workspace-panel" role="tabpanel" id="workspace-panel-futures" aria-labelledby="workspace-tab-futures" tabIndex={0}>
        <LoadingBlock className="panel futures-loading" rows={7} />
      </div>
    );
  }

  if (!data || !selected) {
    return (
      <div className="workspace-panel" role="tabpanel" id="workspace-panel-futures" aria-labelledby="workspace-tab-futures" tabIndex={0}>
        <div className="notice" role="alert">
          <strong>Delayed Treasury-futures feed unavailable.</strong>
          <span>{error instanceof Error ? error.message : "The official daily CMT dashboard remains available."}</span>
          <button className="text-button" type="button" onClick={() => refetch()}>
            <RefreshCw size={15} aria-hidden="true" /> Retry
          </button>
        </div>
      </div>
    );
  }

  const chartColor = maturityColors[selected.key];
  const newestQuoteTime = data.instruments
    .map((instrument) => instrument.quoteTime)
    .filter((value): value is string => Boolean(value))
    .sort()
    .at(-1) ?? null;
  const marketIsOpen = data.instruments.some((instrument) => instrument.marketState === "open");
  const dataStatus = [
    data.cache.warning,
    ...data.warnings,
    error instanceof Error ? error.message : null
  ].filter((message): message is string => Boolean(message)).join(" ");

  return (
    <div className="workspace-panel futures-workspace" role="tabpanel" id="workspace-panel-futures" aria-labelledby="workspace-tab-futures" tabIndex={0}>
      <header className="futures-header">
        <div>
          <p className="eyebrow">Intraday market proxy</p>
          <h2>CBOT Treasury Futures</h2>
          <p>Traded rate-risk proxies for the 2Y, 5Y, 10Y, and long-bond sectors. Prices are delayed and remain separate from official CMT analytics.</p>
        </div>
        <div className="futures-header__status" aria-live="polite">
          <span className={`futures-session futures-session--${marketIsOpen ? "open" : "closed"}`}>
            <i aria-hidden="true" />
            {marketIsOpen ? "Session open" : "Last session"}
          </span>
          <span><Clock3 size={13} aria-hidden="true" /> Quote {formatExchangeTime(newestQuoteTime)}</span>
          <span>{data.range.intervalLabel} · delayed</span>
        </div>
      </header>

      {dataStatus ? (
        <div className="notice notice--warning futures-warning" role="status">
          <strong>Futures data status.</strong>
          <span>{dataStatus}</span>
        </div>
      ) : null}

      <div className="futures-toolbar">
        <span>Intraday price tape</span>
        <div className="futures-toolbar__actions">
          <span className="futures-toolbar__interval">1D · 5m</span>
          <button className="icon-button" type="button" onClick={() => refetch()} aria-label="Refresh delayed futures data" title="Refresh delayed futures data">
            <RefreshCw size={16} className={isFetching ? "spin" : ""} aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="futures-tape" aria-label="Treasury futures contracts">
        {data.instruments.map((instrument) => {
          const DirectionIcon = instrument.rateDirection === "higher" ? ArrowUpRight : ArrowDownRight;
          return (
            <button
              className={`futures-contract futures-contract--${instrument.key.toLowerCase()}${instrument.symbol === selected.symbol ? " futures-contract--active" : ""}`}
              type="button"
              key={instrument.symbol}
              aria-pressed={instrument.symbol === selected.symbol}
              onClick={() => setSelectedSymbol(instrument.symbol)}
            >
              <span className="futures-contract__heading">
                <span><strong>{instrument.shortLabel}</strong><small>{instrument.symbol}</small></span>
                <em>{contractMonth(instrument.contractName)}</em>
              </span>
              <span className="futures-contract__quote">
                <strong>{formatPrice(instrument.price)}</strong>
                <small>{formatSigned(instrument.changeThirtySeconds)} /32 · {formatSigned(instrument.priceChangePct)}%</small>
              </span>
              <span className={`futures-contract__direction futures-contract__direction--${instrument.rateDirection}`}>
                {instrument.rateDirection === "unchanged" ? null : <DirectionIcon size={14} aria-hidden="true" />}
                {rateDirectionLabel(instrument)}
              </span>
              <span className="futures-contract__micro">
                <span>Range {formatPrice(instrument.dayLow)}-{formatPrice(instrument.dayHigh)}</span>
                <span>Vol {formatVolume(instrument.volume)}</span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="futures-layout">
        <article className="panel futures-chart-panel">
          <div className="panel__header futures-chart-panel__header">
            <div>
              <p className="eyebrow">{selected.symbol} · {contractMonth(selected.contractName)}</p>
              <h3>{selected.label} Futures Price</h3>
            </div>
            <div className="futures-chart-panel__quote">
              <strong>{formatPrice(selected.price)}</strong>
              <span className={`futures-chart-panel__change futures-chart-panel__change--${selected.rateDirection}`}>
                {formatSigned(selected.changeThirtySeconds)} /32 · {formatSigned(selected.priceChangePct)}%
              </span>
            </div>
          </div>

          {selected.series.length ? (
            <div className="futures-chart">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={selected.series} margin={{ top: 14, right: 12, bottom: 4, left: 2 }}>
                  <defs>
                    <linearGradient id={`futures-gradient-${selected.key}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={chartColor} stopOpacity={0.19} />
                      <stop offset="100%" stopColor={chartColor} stopOpacity={0.01} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="var(--chart-grid)" strokeDasharray="3 6" />
                  <XAxis
                    dataKey="timestamp"
                    type="number"
                    scale="time"
                    domain={["dataMin", "dataMax"]}
                    minTickGap={48}
                    tickFormatter={(value) => formatChartTick(Number(value))}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "var(--muted)", fontSize: 10 }}
                  />
                  <YAxis
                    orientation="right"
                    domain={chartDomain}
                    width={58}
                    tickFormatter={(value) => Number(value).toFixed(3)}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "var(--muted)", fontSize: 10 }}
                  />
                  <Tooltip
                    content={<FuturesTooltip previousClose={selected.previousClose} />}
                    cursor={{ stroke: "var(--chart-crosshair)", strokeWidth: 1, strokeDasharray: "3 4" }}
                  />
                  <ReferenceLine y={selected.previousClose} stroke="var(--zero-line)" strokeDasharray="5 5" label={{ value: "Prior close", position: "insideTopLeft", fill: "var(--subtle)", fontSize: 9 }} />
                  <Area
                    type="linear"
                    dataKey="price"
                    stroke={chartColor}
                    strokeWidth={2}
                    fill={`url(#futures-gradient-${selected.key})`}
                    dot={false}
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : <div className="empty-state">No intraday bars are available for this contract and range.</div>}

          <dl className="futures-chart-stats">
            <div><dt>Prior close</dt><dd>{formatPrice(selected.previousClose)}</dd></div>
            <div><dt>Session low</dt><dd>{formatPrice(selected.dayLow)}</dd></div>
            <div><dt>Session high</dt><dd>{formatPrice(selected.dayHigh)}</dd></div>
            <div><dt>Reported volume</dt><dd>{formatVolume(selected.volume)}</dd></div>
          </dl>
        </article>

        <aside className="panel futures-methodology">
          <div className="panel__header">
            <div>
              <p className="eyebrow">Rate interpretation</p>
              <h3>Price and Yield Move Inversely</h3>
            </div>
          </div>
          <div className="futures-inverse-map" aria-label="Futures price and yield direction relationship">
            <div className="futures-inverse-map__row futures-inverse-map__row--lower" aria-label="Futures price higher implies a lower yield tendency">
              <span>Futures price <ArrowUpRight size={15} aria-hidden="true" /></span>
              <strong>Yield tendency <ArrowDownRight size={15} aria-hidden="true" /></strong>
            </div>
            <div className="futures-inverse-map__row futures-inverse-map__row--higher" aria-label="Futures price lower implies a higher yield tendency">
              <span>Futures price <ArrowDownRight size={15} aria-hidden="true" /></span>
              <strong>Yield tendency <ArrowUpRight size={15} aria-hidden="true" /></strong>
            </div>
          </div>
          <div className="futures-methodology__notes">
            <p><Info size={14} aria-hidden="true" /><span>Each contract tracks a deliverable Treasury basket and is primarily driven by its cheapest-to-deliver security.</span></p>
            <p><Info size={14} aria-hidden="true" /><span>Raw price moves are not comparable across tenors because duration, DV01, conversion factors, and contract size differ.</span></p>
            <p><Info size={14} aria-hidden="true" /><span>No futures price is converted into a CMT yield, spread, regime, statistic, or CSV field in this dashboard.</span></p>
          </div>
          <div className="futures-methodology__links">
            <a href={data.source.methodologyUrl} target="_blank" rel="noreferrer">CME methodology <ExternalLink size={12} aria-hidden="true" /></a>
            <a href={data.source.pageUrl} target="_blank" rel="noreferrer">Yahoo market page <ExternalLink size={12} aria-hidden="true" /></a>
          </div>
        </aside>
      </div>

      <div className="workspace-source-strip futures-source-strip">
        <span>{data.source.name}. Indicative delayed reference; availability and delay are determined by Yahoo Finance and its exchange-data providers.</span>
        <span>Retrieved {formatExchangeTime(data.source.retrievedAt)} · not official CMT</span>
      </div>
    </div>
  );
}
