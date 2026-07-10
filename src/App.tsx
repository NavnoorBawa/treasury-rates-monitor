import { RefreshCw, Moon, Sun } from "lucide-react";
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
        <div>
          <p className="eyebrow">Institutional rates dashboard</p>
          <h1>U.S. Treasury Yield Monitor</h1>
          <p className="topbar__subtitle">
            2Y, 5Y, 10Y, and 30Y Constant Maturity Treasury rates from the official Treasury feed.
          </p>
        </div>
        <div className="topbar__actions">
          <div className={`refresh-pill ${isFetching ? "refresh-pill--active" : ""}`}>
            <span className="refresh-pill__dot" />
            <span>{data ? `Record ${formatDate(data.source.recordDate)}` : "Connecting"}</span>
          </div>
          <button className="icon-button" type="button" onClick={() => refetch()} aria-label="Refresh data">
            <RefreshCw size={18} className={isFetching ? "spin" : ""} aria-hidden="true" />
          </button>
          <button
            className="icon-button"
            type="button"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === "light" ? "dark" : "light"} theme`}
            aria-pressed={theme === "dark"}
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

      <ResearchWorkbench currentData={data} currentLoading={isLoading || isFetching} theme={theme} />

      <footer className="app-footer">
        <span>Official daily data: U.S. Treasury XML and Federal Reserve H.15 DDP. Intraday reference: TradingView.</span>
        <span>Current values refresh every 15 minutes; historical package refreshes every 30 minutes.</span>
      </footer>
    </main>
  );
}

export default App;
