import { ArrowDownRight, ArrowRight, ArrowUpRight } from "lucide-react";
import { formatBps, formatPct, formatYield } from "../lib/format";
import type { SummaryPoint } from "../types";

interface MetricCardProps {
  point: SummaryPoint;
}

export function MetricCard({ point }: MetricCardProps) {
  const direction = point.changeBps > 0 ? "up" : point.changeBps < 0 ? "down" : "flat";
  const Icon = direction === "up" ? ArrowUpRight : direction === "down" ? ArrowDownRight : ArrowRight;

  return (
    <article className="metric-card">
      <div className="metric-card__topline">
        <span>{point.shortLabel} CMT</span>
        <span className="metric-card__tenor">{point.label}</span>
      </div>
      <div className="metric-card__value">{formatYield(point.value)}</div>
      <div className={`metric-card__change metric-card__change--${direction}`}>
        <Icon size={16} strokeWidth={2.2} aria-hidden="true" />
        <span>{formatBps(point.changeBps)}</span>
        <span className="metric-card__change-pct">{formatPct(point.changePct)}</span>
      </div>
    </article>
  );
}

