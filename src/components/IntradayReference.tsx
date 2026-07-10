import { useEffect, useRef, useState } from "react";
import { ExternalLink, Info } from "lucide-react";
import type { Theme } from "../hooks/useTheme";

const tenors = [
  { label: "2Y", symbol: "TVC:US02Y", path: "TVC-US02Y" },
  { label: "5Y", symbol: "TVC:US05Y", path: "TVC-US05Y" },
  { label: "10Y", symbol: "TVC:US10Y", path: "TVC-US10Y" },
  { label: "30Y", symbol: "TVC:US30Y", path: "TVC-US30Y" }
] as const;

interface IntradayReferenceProps {
  theme: Theme;
}

export function IntradayReference({ theme }: IntradayReferenceProps) {
  const [selectedTenor, setSelectedTenor] = useState<(typeof tenors)[number]>(tenors[2]);
  const widgetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = widgetRef.current;
    if (!container) return;

    container.replaceChildren();
    const widget = document.createElement("div");
    widget.className = "tradingview-widget-container__widget";
    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;
    script.textContent = JSON.stringify({
      autosize: true,
      symbol: selectedTenor.symbol,
      interval: "5",
      timezone: "America/New_York",
      theme,
      style: "2",
      locale: "en",
      backgroundColor: theme === "dark" ? "#151a18" : "#fdfdfb",
      gridColor: theme === "dark" ? "rgba(190, 201, 195, 0.10)" : "rgba(64, 74, 68, 0.10)",
      allow_symbol_change: false,
      calendar: false,
      details: false,
      hide_legend: false,
      hide_side_toolbar: true,
      hide_top_toolbar: false,
      hide_volume: true,
      save_image: false,
      withdateranges: true,
      studies: []
    });
    container.append(widget, script);

    return () => container.replaceChildren();
  }, [selectedTenor, theme]);

  return (
    <div className="intraday-shell">
      <div className="research-header research-header--workspace intraday-header">
        <div>
          <p className="eyebrow">Market reference</p>
          <h2>Intraday Treasury Benchmark</h2>
          <p>Monitor indicative benchmark-bond yields during the U.S. trading day without mixing them into the official daily CMT dataset.</p>
        </div>
        <a className="intraday-external-link" href={`https://www.tradingview.com/symbols/${selectedTenor.path}/`} target="_blank" rel="noreferrer">
          Open {selectedTenor.label} chart
          <ExternalLink size={14} aria-hidden="true" />
        </a>
      </div>

      <div className="intraday-toolbar">
        <div>
          <span className="regime-control-group__label">Benchmark tenor</span>
          <div className="segmented-control segmented-control--compact" aria-label="Intraday benchmark tenor">
            {tenors.map((tenor) => (
              <button
                className={selectedTenor.symbol === tenor.symbol ? "segmented-control__button segmented-control__button--active" : "segmented-control__button"}
                type="button"
                key={tenor.symbol}
                aria-pressed={selectedTenor.symbol === tenor.symbol}
                onClick={() => setSelectedTenor(tenor)}
              >
                {tenor.label}
              </button>
            ))}
          </div>
        </div>
        <div className="intraday-status">
          <strong>{selectedTenor.label} benchmark yield</strong>
          <span>Default interval: 5 minutes · New York time</span>
        </div>
      </div>

      <article className="panel intraday-panel">
        <div ref={widgetRef} className="tradingview-widget-container intraday-widget" aria-label={`${selectedTenor.label} intraday Treasury benchmark chart`} />
        <div className="intraday-attribution">
          <a href={`https://www.tradingview.com/symbols/${selectedTenor.path}/`} target="_blank" rel="noreferrer">{selectedTenor.label} Treasury benchmark chart by TradingView</a>
        </div>
      </article>

      <div className="workspace-source-strip intraday-disclosure">
        <Info size={16} aria-hidden="true" />
        <span>This third-party panel is an intraday market reference, with availability and delay determined by TradingView and its data providers. It is not the U.S. Treasury Constant Maturity fixing and is excluded from dashboard spreads, regime classifications, statistics, and CSV exports.</span>
        <span>Source: TradingView · TVC benchmark</span>
      </div>
    </div>
  );
}
