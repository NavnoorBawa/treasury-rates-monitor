import { useEffect, useMemo, useState, type CSSProperties } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { Info } from "lucide-react";
import { formatBps, formatDate } from "../lib/format";
import {
  buildCurveMoveForDates,
  buildCurveRegimeTimeline,
  currentSpreadForPair,
  curveMoveShapeToleranceBps,
  curveMoveTypes,
  findPairObservationOnOrBefore,
  getComparisonTargetDate,
  type CurveComparisonHorizon,
  type CurveMoveHorizon,
  type CurveMoveType,
  type CurvePair,
  type CurveRegimePoint
} from "../lib/research";
import type { HistoricalRow } from "../types";

interface CurveRegimeTimelineProps {
  rows: HistoricalRow[];
  pair: CurvePair;
  startDate: string;
  endDate: string;
  horizon: CurveMoveHorizon;
}

interface SpreadChartPoint {
  date: string;
  spreadBps: number | null;
  regimeType: CurveMoveType | null;
  [seriesKey: string]: string | number | null;
}

interface RegimeEpisode {
  id: string;
  type: CurveMoveType;
  startDate: string;
  endDate: string;
  durationDays: number;
  points: CurveRegimePoint[];
}

interface EpisodeMove {
  shortDeltaBps: number;
  longDeltaBps: number;
  spreadDeltaBps: number;
  levelDeltaBps: number;
}

type AnalysisWindow = CurveComparisonHorizon | "RANGE" | "CUSTOM";

const analysisWindows: Array<{ key: Exclude<AnalysisWindow, "CUSTOM">; label: string }> = [
  { key: "1W", label: "1W" },
  { key: "1M", label: "1M" },
  { key: "3M", label: "3M" },
  { key: "6M", label: "6M" },
  { key: "1Y", label: "1Y" },
  { key: "RANGE", label: "Range start" }
];

const typeColor: Record<CurveMoveType, string> = {
  "Bull steepening": "var(--regime-bull-steepening)",
  "Bear steepening": "var(--regime-bear-steepening)",
  "Bull flattening": "var(--regime-bull-flattening)",
  "Bear flattening": "var(--regime-bear-flattening)",
  "Parallel shift higher": "var(--regime-parallel-higher)",
  "Parallel shift lower": "var(--regime-parallel-lower)"
};

const regimeColorGroups: Array<{
  label: string;
  rule: (toleranceBps: number) => string;
  moves: Array<{ type: CurveMoveType; label: string; direction: string }>;
}> = [
  {
    label: "Steepening",
    rule: (toleranceBps) => `Slope Δ > +${toleranceBps} bps`,
    moves: [
      { type: "Bull steepening", label: "Bull", direction: "Yields lower" },
      { type: "Bear steepening", label: "Bear", direction: "Yields higher" }
    ]
  },
  {
    label: "Flattening",
    rule: (toleranceBps) => `Slope Δ < -${toleranceBps} bps`,
    moves: [
      { type: "Bull flattening", label: "Bull", direction: "Yields lower" },
      { type: "Bear flattening", label: "Bear", direction: "Yields higher" }
    ]
  },
  {
    label: "Near-parallel",
    rule: (toleranceBps) => `|Slope Δ| ≤ ${toleranceBps} bps`,
    moves: [
      { type: "Parallel shift lower", label: "Lower", direction: "Yields lower" },
      { type: "Parallel shift higher", label: "Higher", direction: "Yields higher" }
    ]
  }
];

const compactDateTick = (date: string) => {
  const value = new Date(`${date}T00:00:00Z`);
  return new Intl.DateTimeFormat("en-US", { month: "short", year: "2-digit", timeZone: "UTC" }).format(value);
};

const intervalLabel = (startDate: string, endDate: string) => `${formatDate(startDate)} to ${formatDate(endDate)}`;

const regimeStyle = (type: CurveMoveType) => ({ "--regime-color": typeColor[type] }) as CSSProperties;

const regimeSeriesKey = (type: CurveMoveType) => `regime-${type}`;

const periodNoun = (horizon: CurveMoveHorizon) => horizon === "1W" ? "week" : "month";

const analysisWindowLabel = (window: AnalysisWindow) => {
  if (window === "RANGE") return "Range start";
  if (window === "CUSTOM") return "Custom dates";
  return window;
};

const calendarDaySpan = (startDate: string, endDate: string) =>
  (new Date(`${endDate}T00:00:00Z`).getTime() - new Date(`${startDate}T00:00:00Z`).getTime()) / 86_400_000;

const aggregateEpisodeMove = (episode: RegimeEpisode): EpisodeMove =>
  episode.points.reduce<EpisodeMove>(
    (total, point) => ({
      shortDeltaBps: total.shortDeltaBps + point.shortDeltaBps,
      longDeltaBps: total.longDeltaBps + point.longDeltaBps,
      spreadDeltaBps: total.spreadDeltaBps + point.spreadDeltaBps,
      levelDeltaBps: total.levelDeltaBps + point.levelDeltaBps
    }),
    { shortDeltaBps: 0, longDeltaBps: 0, spreadDeltaBps: 0, levelDeltaBps: 0 }
  );

const buildEpisodes = (timeline: CurveRegimePoint[]): RegimeEpisode[] => {
  const episodes: RegimeEpisode[] = [];

  timeline.forEach((point) => {
    const previous = episodes.at(-1);
    const continuesPrevious = previous?.type === point.type && previous.endDate === point.comparisonDate;

    if (continuesPrevious && previous) {
      previous.endDate = point.date;
      previous.points.push(point);
      return;
    }

    episodes.push({
      id: `${point.type}-${point.comparisonDate}-${point.date}`,
      type: point.type,
      startDate: point.comparisonDate,
      endDate: point.date,
      durationDays: 0,
      points: [point]
    });
  });

  return episodes.map((episode) => ({
    ...episode,
    durationDays: Math.max(
      1,
      Math.round(
        (new Date(`${episode.endDate}T00:00:00Z`).getTime() - new Date(`${episode.startDate}T00:00:00Z`).getTime()) / 86_400_000
      )
    )
  }));
};

interface SpreadTooltipProps {
  active?: boolean;
  payload?: Array<{ payload?: SpreadChartPoint }>;
}

function SpreadTooltip({ active, payload }: SpreadTooltipProps) {
  const point = payload?.[0]?.payload;
  if (!active || !point || point.spreadBps === null) return null;

  return (
    <div className="chart-tooltip chart-tooltip--regime" style={point.regimeType ? regimeStyle(point.regimeType) : undefined}>
      <span className="chart-tooltip__label">{formatDate(point.date)}</span>
      <div className="chart-tooltip__rows">
        <div className="chart-tooltip__row"><span>Curve spread</span><strong>{point.spreadBps.toFixed(1)} bps</strong></div>
        {point.regimeType ? <div className="chart-tooltip__row"><span>Completed-period regime</span><RegimeBadge type={point.regimeType} /></div> : null}
      </div>
    </div>
  );
}

function RegimeBadge({ type }: { type: CurveMoveType }) {
  return (
    <span className="regime-badge" style={regimeStyle(type)}>
      <i aria-hidden="true" />
      {type}
    </span>
  );
}

function HelpTip({ label }: { label: string }) {
  return (
    <button className="regime-help" type="button" aria-label={label} data-tooltip={label}>
      <Info size={13} aria-hidden="true" />
    </button>
  );
}

export function CurveRegimeTimeline({ rows, pair, startDate, endDate, horizon }: CurveRegimeTimelineProps) {
  const timeline = useMemo(
    () => buildCurveRegimeTimeline(rows, pair, startDate, endDate, horizon),
    [endDate, horizon, pair, rows, startDate]
  );
  const rawSpreadSeries = useMemo(
    () => rows
      .filter((row) => row.date >= startDate && row.date <= endDate)
      .map((row) => ({ date: row.date, spreadBps: currentSpreadForPair(row, pair) })),
    [endDate, pair, rows, startDate]
  );
  const rangeMove = useMemo(
    () => buildCurveMoveForDates(rows, pair, endDate, startDate, curveMoveShapeToleranceBps[horizon]),
    [endDate, horizon, pair, rows, startDate]
  );
  const episodes = useMemo(() => buildEpisodes(timeline), [timeline]);
  const spreadSeries = useMemo<SpreadChartPoint[]>(
    () => rawSpreadSeries.map((point) => {
      const matchingEpisode = episodes.find((episode) => point.date >= episode.startDate && point.date <= episode.endDate);
      const regimeType = matchingEpisode?.type ?? null;

      return {
        ...point,
        regimeType,
        ...(regimeType ? { [regimeSeriesKey(regimeType)]: point.spreadBps } : {})
      };
    }),
    [episodes, rawSpreadSeries]
  );
  const [asOfDate, setAsOfDate] = useState(endDate);
  const [analysisWindow, setAnalysisWindow] = useState<AnalysisWindow>("1M");
  const [customReferenceDate, setCustomReferenceDate] = useState(startDate);
  const [selectedEpisodeId, setSelectedEpisodeId] = useState<string | null>(null);

  useEffect(() => {
    setAsOfDate((current) => !current || current < startDate || current > endDate ? endDate : current);
    setCustomReferenceDate((current) => !current || current < startDate || current >= endDate ? startDate : current);
    setSelectedEpisodeId(null);
  }, [endDate, pair.key, startDate]);

  const analysisReferenceTarget = useMemo(() => {
    if (analysisWindow === "RANGE") return startDate;
    if (analysisWindow === "CUSTOM") return customReferenceDate;
    return getComparisonTargetDate(asOfDate, analysisWindow);
  }, [analysisWindow, asOfDate, customReferenceDate, startDate]);
  const analysisAsOf = useMemo(
    () => findPairObservationOnOrBefore(rows, pair, asOfDate),
    [asOfDate, pair, rows]
  );
  const analysisToleranceBps = useMemo(() => {
    if (!analysisAsOf || analysisWindow === "1W") return curveMoveShapeToleranceBps["1W"];
    return calendarDaySpan(analysisReferenceTarget, analysisAsOf.date) <= 11
      ? curveMoveShapeToleranceBps["1W"]
      : curveMoveShapeToleranceBps["1M"];
  }, [analysisAsOf, analysisReferenceTarget, analysisWindow]);
  const analysisMove = useMemo(
    () => analysisAsOf
      ? buildCurveMoveForDates(rows, pair, analysisAsOf.date, analysisReferenceTarget, analysisToleranceBps)
      : null,
    [analysisAsOf, analysisReferenceTarget, analysisToleranceBps, pair, rows]
  );

  const selectedEpisode = episodes.find((episode) => episode.id === selectedEpisodeId);
  const rangeEndPoint = [...spreadSeries].reverse().find((point) => point.spreadBps !== null);
  const counts = useMemo(
    () => Object.fromEntries(curveMoveTypes.map((type) => [type, timeline.filter((point) => point.type === type).length])) as Record<CurveMoveType, number>,
    [timeline]
  );

  if (!spreadSeries.some((point) => point.spreadBps !== null)) {
    return <div className="empty-state">No valid observations are available for this segment and range.</div>;
  }

  const noun = periodNoun(horizon);
  const asOfRecordDate = analysisAsOf?.date ?? asOfDate;
  const handleEpisodeSelect = (episode: RegimeEpisode) => {
    setSelectedEpisodeId(episode.id);
    setAsOfDate(episode.endDate);
    setCustomReferenceDate(episode.startDate);
    setAnalysisWindow("CUSTOM");
  };

  return (
    <article className="panel regime-panel">
      <div className="panel__header">
        <div>
          <p className="eyebrow">Historical curve regimes</p>
          <h3>{pair.longLabel} regime map</h3>
        </div>
        <span className="panel__meta">{horizon === "1W" ? "Weekly" : "Monthly"} calendar intervals</span>
      </div>

      <div className="regime-analysis-controls" role="group" aria-label="As-of curve-regime analysis">
        <div className="regime-analysis-controls__date">
          <div className="regime-field-label">
            <label htmlFor="regime-end-date">End date</label>
            <HelpTip label="The business-day observation at which the selected two-tenor move ends." />
          </div>
          <input
            id="regime-end-date"
            type="date"
            min={startDate}
            max={endDate}
            value={asOfDate}
            onChange={(event) => {
              setAsOfDate(event.target.value);
              setSelectedEpisodeId(null);
            }}
            onInput={(event) => {
              setAsOfDate(event.currentTarget.value);
              setSelectedEpisodeId(null);
            }}
          />
        </div>
        <div className="regime-analysis-controls__window">
          <div className="regime-field-label">
            <span>Lookback</span>
            <HelpTip label="The reference period used to classify the selected curve move. Custom dates uses the start date field." />
          </div>
          <div className="regime-analysis-window" aria-label="As-of comparison window">
            {analysisWindows.map((window) => (
              <button
                className={analysisWindow === window.key ? "regime-analysis-window__button regime-analysis-window__button--active" : "regime-analysis-window__button"}
                type="button"
                key={window.key}
                aria-pressed={analysisWindow === window.key}
                onClick={() => {
                  setAnalysisWindow(window.key);
                  setSelectedEpisodeId(null);
                }}
              >
                {window.label}
              </button>
            ))}
            <button
              className={analysisWindow === "CUSTOM" ? "regime-analysis-window__button regime-analysis-window__button--active" : "regime-analysis-window__button"}
              type="button"
              aria-pressed={analysisWindow === "CUSTOM"}
              onClick={() => {
                setAnalysisWindow("CUSTOM");
                setSelectedEpisodeId(null);
              }}
            >
              Custom dates
            </button>
          </div>
        </div>
        {analysisWindow === "CUSTOM" ? (
          <div className="regime-analysis-controls__date">
            <div className="regime-field-label">
              <label htmlFor="regime-start-date">Start date</label>
              <HelpTip label="The business-day observation from which a custom date-to-date curve move is measured." />
            </div>
            <input
              id="regime-start-date"
              type="date"
              min={startDate}
              max={asOfDate}
              value={customReferenceDate}
              onChange={(event) => {
                setCustomReferenceDate(event.target.value);
                setSelectedEpisodeId(null);
              }}
              onInput={(event) => {
                setCustomReferenceDate(event.currentTarget.value);
                setSelectedEpisodeId(null);
              }}
            />
          </div>
        ) : null}
      </div>

      <div className="regime-summary">
        <div className="regime-summary__tile regime-summary__tile--regime" style={analysisMove ? regimeStyle(analysisMove.type) : undefined}>
          <span>Selected period regime</span>
          {analysisMove ? <RegimeBadge type={analysisMove.type} /> : <strong>n/a</strong>}
          <small>{analysisMove ? `${intervalLabel(analysisMove.comparisonDate, asOfRecordDate)} · slope change ${formatBps(analysisMove.spreadDeltaBps)}` : "Select a valid reference period"}</small>
        </div>
        <div className="regime-summary__tile">
          <span>Visible-range net slope change</span>
          <strong>{formatBps(rangeMove?.spreadDeltaBps)}</strong>
          <small>{rangeMove ? `${rangeMove.type} · ${formatDate(rangeMove.comparisonDate)} to ${formatDate(endDate)}` : "Insufficient pair observations"}</small>
        </div>
        <div className="regime-summary__tile">
          <span>Range-end {pair.label} spread</span>
          <strong>{rangeEndPoint?.spreadBps?.toFixed(1) ?? "n/a"} bps</strong>
          <small>As of {formatDate(rangeEndPoint?.date)}</small>
        </div>
      </div>

      <div className="regime-chart">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={spreadSeries} margin={{ top: 14, right: 20, bottom: 6, left: 0 }}>
            <CartesianGrid vertical={false} stroke="var(--chart-grid)" strokeDasharray="3 6" />
            <XAxis dataKey="date" minTickGap={42} tickFormatter={compactDateTick} tickLine={false} axisLine={false} tick={{ fill: "var(--muted)", fontSize: 12 }} />
            <YAxis tickLine={false} axisLine={false} width={66} tickFormatter={(value) => `${Number(value).toFixed(0)} bps`} tick={{ fill: "var(--muted)", fontSize: 12 }} />
            <Tooltip content={<SpreadTooltip />} />
            <ReferenceLine y={0} stroke="var(--zero-line)" strokeDasharray="4 5" />
            {analysisMove && analysisAsOf ? (
              <ReferenceArea
                x1={analysisMove.comparisonDate}
                x2={analysisAsOf.date}
                fill={typeColor[analysisMove.type]}
                fillOpacity={0.12}
                stroke={typeColor[analysisMove.type]}
                strokeOpacity={0.38}
                strokeDasharray="3 4"
                ifOverflow="hidden"
              />
            ) : null}
            <Line
              type="linear"
              dataKey="spreadBps"
              name={`${pair.label} outline`}
              stroke="var(--chart-path-outline)"
              strokeWidth={5}
              dot={false}
              connectNulls={false}
              isAnimationActive={false}
              legendType="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Line
              type="linear"
              dataKey="spreadBps"
              name={pair.label}
              stroke="var(--chart-regime-neutral)"
              strokeWidth={2.1}
              dot={false}
              connectNulls={false}
              isAnimationActive={false}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {curveMoveTypes.map((type) => (
              <Line
                key={type}
                type="linear"
                dataKey={regimeSeriesKey(type)}
                name={type}
                stroke={typeColor[type]}
                strokeWidth={3}
                dot={false}
                connectNulls={false}
                isAnimationActive={false}
                legendType="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="regime-ribbon-wrap">
        <div className="regime-ribbon__header">
          <span>Completed {noun} regimes <HelpTip label={`Each colored block is a completed ${noun} move. Select a block to load its exact dates as a custom comparison.`} /></span>
          <span>{timeline.length ? intervalLabel(timeline[0].comparisonDate, timeline.at(-1)?.date ?? endDate) : "No completed intervals in view"}</span>
        </div>
        <div className="regime-ribbon" aria-label={`${horizon} curve-regime intervals`}>
          {episodes.length ? episodes.map((episode) => {
            const move = aggregateEpisodeMove(episode);
            const isSelected = episode.id === selectedEpisode?.id;
            const pluralizedPeriods = episode.points.length === 1 ? `${noun}` : `${noun}s`;
            const label = `${episode.type}, ${episode.points.length} consecutive ${pluralizedPeriods}, ${intervalLabel(episode.startDate, episode.endDate)}, slope ${formatBps(move.spreadDeltaBps)}`;

            return (
              <button
                key={episode.id}
                type="button"
                className={isSelected ? "regime-ribbon__segment regime-ribbon__segment--active" : "regime-ribbon__segment"}
                style={{ ...regimeStyle(episode.type), flexGrow: episode.durationDays } as CSSProperties}
                onClick={() => handleEpisodeSelect(episode)}
                aria-label={label}
                aria-pressed={isSelected}
                title={label}
              />
            );
          }) : <span className="regime-ribbon__empty">No completed calendar {noun}s</span>}
        </div>
      </div>

      <div className="regime-key" aria-label="Curve movement color key">
        {regimeColorGroups.map((group) => (
          <div className="regime-key__group" key={group.label}>
            <div className="regime-key__heading">
              <strong>{group.label}</strong>
              <span>{group.rule(curveMoveShapeToleranceBps[horizon])}</span>
            </div>
            <div className="regime-key__moves">
              {group.moves.map((move) => (
                <span
                  className="regime-key__move"
                  key={move.type}
                  style={regimeStyle(move.type)}
                  aria-label={`${move.type}: ${counts[move.type]} completed ${noun} classifications`}
                  title={move.type}
                >
                  <i aria-hidden="true" />
                  <span><strong>{move.label}</strong><small>{move.direction}</small></span>
                  <b>{counts[move.type]}</b>
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {analysisMove ? (
        <section className="regime-inspector regime-inspector--coded" style={regimeStyle(analysisMove.type)} aria-live="polite">
          <div className="regime-inspector__heading">
            <div>
              <span>As-of decomposition · {analysisWindowLabel(analysisWindow)}</span>
              <RegimeBadge type={analysisMove.type} />
              <small>{intervalLabel(analysisMove.comparisonDate, asOfRecordDate)} · {analysisToleranceBps} bps slope-change tolerance</small>
            </div>
            <p>{analysisMove.rationale}</p>
          </div>
          <dl className="regime-inspector__metrics">
            <div><dt>{pair.shortKey} yield change</dt><dd>{formatBps(analysisMove.shortDeltaBps)}</dd></div>
            <div><dt>{pair.longKey} yield change</dt><dd>{formatBps(analysisMove.longDeltaBps)}</dd></div>
            <div><dt>Pair average move</dt><dd>{formatBps(analysisMove.levelDeltaBps)}</dd></div>
            <div><dt>Pair slope change</dt><dd>{formatBps(analysisMove.spreadDeltaBps)}</dd></div>
          </dl>
        </section>
      ) : null}

      <div className="spread-note">
        <Info size={15} aria-hidden="true" />
        <span>
          The chart highlight is the selected date-to-date comparison; the ribbon is completed calendar-period history. Pair average move is the average of the selected-tenor yield changes; pair slope change is the change in the long-minus-short spread. Bull/bear follows the pair average move. Near-parallel applies only when the pair&apos;s slope change is within the stated tolerance, not to the full Treasury curve.
        </span>
      </div>
    </article>
  );
}
