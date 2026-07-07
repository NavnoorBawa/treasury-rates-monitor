import { Database, ExternalLink, TimerReset } from "lucide-react";
import { formatBps, formatDate, formatTimestamp } from "../lib/format";
import type { SpreadPoint, TreasuryPayload } from "../types";

interface MarketSummaryProps {
  data: TreasuryPayload;
}

const spreadDirectionClass = (spread: SpreadPoint) => {
  if (spread.changeBps > 0) return "summary-row__value--up";
  if (spread.changeBps < 0) return "summary-row__value--down";
  return "";
};

export function MarketSummary({ data }: MarketSummaryProps) {
  return (
    <aside className="panel panel--summary">
      <div className="panel__header">
        <div>
          <p className="eyebrow">Session</p>
          <h2>Market Summary</h2>
        </div>
      </div>

      <div className="summary-list">
        {data.spreads.map((spread) => (
          <div className="summary-row" key={spread.key}>
            <span>{spread.label}</span>
            <strong className={spreadDirectionClass(spread)}>
              {spread.valueBps.toFixed(1)} bps
              <small>{formatBps(spread.changeBps)}</small>
            </strong>
          </div>
        ))}
      </div>

      <div className="source-box">
        <div className="source-box__item">
          <Database size={16} aria-hidden="true" />
          <div>
            <span>Latest official record</span>
            <strong>{formatDate(data.source.recordDate)}</strong>
          </div>
        </div>
        <div className="source-box__item">
          <TimerReset size={16} aria-hidden="true" />
          <div>
            <span>Feed timestamp</span>
            <strong>{formatTimestamp(data.source.feedUpdatedAt)}</strong>
          </div>
        </div>
      </div>

      <a className="source-link" href={data.source.pageUrl} target="_blank" rel="noreferrer">
        <span>U.S. Treasury source</span>
        <ExternalLink size={15} aria-hidden="true" />
      </a>
    </aside>
  );
}

