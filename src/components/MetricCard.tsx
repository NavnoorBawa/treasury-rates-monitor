import { ArrowDownRight, ArrowRight, ArrowUpRight } from "lucide-react";
import { formatBps, formatDate, formatPct, formatYield } from "../lib/format";
import type { SummaryPoint } from "../types";

interface MetricCardProps {
  point: SummaryPoint;
  previousRecordDate: string;
}

export function MetricCard({ point, previousRecordDate }: MetricCardProps) {
  const direction = point.changeBps > 0 ? "up" : point.changeBps < 0 ? "down" : "flat";
  const Icon = direction === "up" ? ArrowUpRight : direction === "down" ? ArrowDownRight : ArrowRight;
  const maturityClass = `metric-card--${point.key.toLowerCase()}`;

  return (
    <article className={`metric-card ${maturityClass}`}>
      <div className="metric-card__topline">
        <span>{point.shortLabel} CMT</span>
        <span className="metric-card__tenor">{point.label}</span>
      </div>
      <div className="metric-card__value">{formatYield(point.value)}</div>
      <div className={`metric-card__change metric-card__change--${direction}`}>
        <Icon size={16} strokeWidth={2.2} aria-hidden="true" />
        <span>{formatBps(point.changeBps)}</span>
        <span
          className="metric-card__change-pct"
          title="Percentage change in the yield level, not bond total return."
          aria-label={`Yield-level percentage change ${formatPct(point.changePct)}`}
        >
          {formatPct(point.changePct)}
        </span>
        <small className="metric-card__change-context">vs {formatDate(previousRecordDate)} fixing</small>
      </div>
    </article>
  );
}
