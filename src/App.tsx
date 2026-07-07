import { RefreshCw, Moon, Sun } from "lucide-react";
import { HistoricalChart } from "./components/HistoricalChart";
import { LoadingBlock } from "./components/LoadingBlock";
import { MarketSummary } from "./components/MarketSummary";
import { MetricCard } from "./components/MetricCard";
import { ResearchWorkbench } from "./components/ResearchWorkbench";
import { YieldCurveChart } from "./components/YieldCurveChart";
import { useTheme } from "./hooks/useTheme";
import { useTreasuryYields } from "./hooks/useTreasuryYields";
import { formatDate, formatTimestamp } from "./lib/format";
import type { DashboardMaturityKey } from "./types";
import "./styles/global.css";

const maturityOrder: DashboardMaturityKey[] = ["2Y", "5Y", "10Y", "30Y"];

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
          : data?.summary.map((point) => <MetricCard key={point.key} point={point} />)}
      </section>

      <section className="dashboard-grid">
        {data ? <YieldCurveChart data={data.curve} /> : <LoadingBlock className="panel panel--curve" rows={6} />}
        {data ? <MarketSummary data={data} /> : <LoadingBlock className="panel panel--summary" rows={6} />}
      </section>

      <section className="section-header">
        <div>
          <p className="eyebrow">Historical context</p>
          <h2>One-Year Yield History</h2>
        </div>
        <span>{data ? `Last feed refresh ${formatTimestamp(data.source.feedUpdatedAt)}` : "Loading feed timestamp"}</span>
      </section>

      <section className="history-grid" aria-label="Historical charts by maturity">
        {isLoading
          ? Array.from({ length: 4 }).map((_, index) => <LoadingBlock key={index} className="history-card" rows={5} />)
          : data
            ? maturityOrder.map((key) => {
                const summary = data.summary.find((point) => point.key === key);
                if (!summary) return null;
                return <HistoricalChart key={key} maturityKey={key} summary={summary} data={data.history[key]} />;
              })
            : null}
      </section>

      <ResearchWorkbench />

      <footer className="app-footer">
        <span>Current data: U.S. Treasury XML. Long-run history: Federal Reserve H.15 DDP.</span>
        <span>Current values refresh every 15 minutes; historical package refreshes every 30 minutes.</span>
      </footer>
    </main>
  );
}

export default App;
