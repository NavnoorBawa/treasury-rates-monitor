import { Landmark, RefreshCw, Moon, Sun } from "lucide-react";
import { LoadingBlock } from "./components/LoadingBlock";
import { MetricCard } from "./components/MetricCard";
import { ResearchWorkbench } from "./components/ResearchWorkbench";
import { useTheme } from "./hooks/useTheme";
import { useTreasuryYields } from "./hooks/useTreasuryYields";
import { formatDate } from "./lib/format";
import "./styles/global.css";

function App() {
  const { theme, toggleTheme } = useTheme();
  const { data, error, isFetching, isLoading, refetch } = useTreasuryYields();

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="topbar__brand">
          <div className="topbar__mark" aria-hidden="true">
            <Landmark size={19} strokeWidth={1.8} />
          </div>
          <div className="topbar__identity">
            <div className="topbar__deskline">
              <span>US Rates</span>
              <i aria-hidden="true" />
              <span>Treasury Research</span>
            </div>
            <h1>U.S. Treasury Curve Monitor</h1>
            <p className="topbar__subtitle">
              Official CMT rates, curve spreads, historical regimes, and date-to-date analysis.
            </p>
          </div>
        </div>
        <div className="topbar__actions">
          <div className={`refresh-pill ${isFetching ? "refresh-pill--active" : ""}`} aria-live="polite">
            <span className="refresh-pill__dot" />
            <span className="refresh-pill__copy">
              <small>Official close</small>
              <strong>{data ? formatDate(data.source.recordDate) : "Connecting"}</strong>
            </span>
          </div>
          <button className="icon-button" type="button" onClick={() => refetch()} aria-label="Refresh data" title="Refresh official data">
            <RefreshCw size={18} className={isFetching ? "spin" : ""} aria-hidden="true" />
          </button>
          <button
            className="icon-button"
            type="button"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === "light" ? "dark" : "light"} theme`}
            aria-pressed={theme === "dark"}
            title={`Switch to ${theme === "light" ? "dark" : "light"} theme`}
          >
            {theme === "light" ? <Moon size={18} aria-hidden="true" /> : <Sun size={18} aria-hidden="true" />}
          </button>
        </div>
      </header>

      {error ? (
        <section className="notice" role="alert">
          <strong>Unable to load Treasury data.</strong>
          <span>{error instanceof Error ? error.message : "Please retry in a moment."}</span>
        </section>
      ) : null}

      {data?.cache.warning ? (
        <section className="notice notice--warning" role="status">
          <strong>Stale cache in use.</strong>
          <span>{data.cache.warning}</span>
        </section>
      ) : null}

      <section className="metric-grid" aria-label="Current Treasury yields">
        {isLoading
          ? Array.from({ length: 4 }).map((_, index) => <LoadingBlock key={index} className="metric-card" rows={3} />)
          : data?.summary.map((point) => <MetricCard key={point.key} point={point} previousRecordDate={data.source.previousRecordDate} />)}
      </section>

      <ResearchWorkbench currentData={data} currentLoading={isLoading || isFetching} />

      <footer className="app-footer">
        <span>Current data: U.S. Treasury XML. Long-run history: Federal Reserve H.15 DDP.</span>
        <span>The app checks Treasury every 15 minutes; the official CMT fixing publishes once per business day.</span>
      </footer>
    </main>
  );
}

export default App;
