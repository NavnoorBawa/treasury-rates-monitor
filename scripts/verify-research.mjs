import assert from "node:assert/strict";
import {
  buildCurveMove,
  buildCurveRegimeTimeline,
  buildStats,
  buildTreasuryCurveCsv,
  classifyCurveMove,
  curvePairs,
  getEventMarkerDate,
  movementRationale
} from "../src/lib/research.ts";

const expectedClassifications = [
  [4, -1, "Bull steepening"],
  [4, 1, "Bear steepening"],
  [-4, -1, "Bull flattening"],
  [-4, 1, "Bear flattening"],
  [3, -1, "Parallel shift lower"],
  [-3, 1, "Parallel shift higher"]
];

for (const [spreadDeltaBps, levelDeltaBps, expected] of expectedClassifications) {
  assert.equal(classifyCurveMove(spreadDeltaBps, levelDeltaBps, 3), expected);
}

assert.equal(classifyCurveMove(4, 0, 3), "Bear steepening", "Zero pair average should use the disclosed nonnegative tie-break");

const pair = curvePairs.find((item) => item.key === "10Y2Y");
assert.ok(pair, "10Y-2Y curve pair is required");

const row = (date, twoYear, fiveYear, tenYear, thirtyYear) => ({
  date,
  "2Y": twoYear,
  "5Y": fiveYear,
  "10Y": tenYear,
  "30Y": thirtyYear,
  "5Y2Y": (fiveYear - twoYear) * 100,
  "10Y2Y": (tenYear - twoYear) * 100,
  "30Y2Y": (thirtyYear - twoYear) * 100,
  "10Y5Y": (tenYear - fiveYear) * 100,
  "30Y5Y": (thirtyYear - fiveYear) * 100,
  "30Y10Y": (thirtyYear - tenYear) * 100
});

const reference = row("2026-01-02", 4, 4.2, 4.5, 4.8);
const asOf = row("2026-01-09", 4.1, 4.3, 4.7, 4.9);
const move = buildCurveMove(reference, asOf, pair, 3);
assert.ok(move, "Curve move should be calculated for complete pair observations");
assert.equal(move.shortDeltaBps, 10);
assert.equal(move.longDeltaBps, 20);
assert.equal(move.spreadDeltaBps, 10);
assert.equal(move.levelDeltaBps, 15);
assert.equal(move.type, "Bear steepening");
assert.match(movementRationale("Bear steepening", pair, 0), /average yield change was exactly zero/);

const statsRows = [
  row("2026-01-02", 4, 4.2, 4.5, 4.8),
  row("2026-01-05", 4.2, 4.3, 4.6, 4.9),
  row("2026-01-06", 4.1, 4.25, 4.55, 4.85)
];
const twoYearStats = buildStats(statsRows).find((item) => item.key === "2Y");
assert.ok(twoYearStats, "2Y statistics are required");
assert.equal(twoYearStats.latest, 4.1);
assert.equal(twoYearStats.latestObservationDate, "2026-01-06");
assert.equal(twoYearStats.min, 4);
assert.equal(twoYearStats.max, 4.2);
assert.equal(twoYearStats.average, 4.1);
assert.equal(twoYearStats.observations, 3);
assert.ok(Math.abs(twoYearStats.percentile - 66.6666666667) < 1e-6);
assert.ok(twoYearStats.annualizedVolBps > 0);

const timelineRows = [
  row("2026-01-30", 4, 4.2, 4.5, 4.8),
  row("2026-02-27", 4.1, 4.25, 4.55, 4.85),
  row("2026-03-10", 4.15, 4.3, 4.6, 4.9)
];
const completedMonthlyTimeline = buildCurveRegimeTimeline(timelineRows, pair, "2026-01-01", "2026-03-10", "1M");
assert.equal(completedMonthlyTimeline.length, 1, "Open terminal months must remain unclassified");
assert.equal(completedMonthlyTimeline[0].comparisonDate, "2026-01-30");
assert.equal(completedMonthlyTimeline[0].date, "2026-02-27");

assert.equal(
  getEventMarkerDate(
    { id: "911", title: "September 11 attacks", category: "Geopolitical", startDate: "2001-09-11", description: "Test event" },
    [row("2001-09-10", 4, 4.2, 4.5, 4.8), row("2001-09-13", 3.9, 4.1, 4.4, 4.7)],
    "2001-09-01",
    "2001-09-30"
  ),
  "2001-09-13",
  "Events without same-day CMT data should mark the next available observation"
);

const csv = buildTreasuryCurveCsv([statsRows[0]]);
const [header, csvRow] = csv.split("\n");
assert.equal(
  header,
  "date,2Y_yield_pct_pa,5Y_yield_pct_pa,10Y_yield_pct_pa,30Y_yield_pct_pa,5Y_minus_2Y_spread_bps,10Y_minus_2Y_spread_bps,30Y_minus_2Y_spread_bps,10Y_minus_5Y_spread_bps,30Y_minus_5Y_spread_bps,30Y_minus_10Y_spread_bps"
);
assert.equal(csvRow, "2026-01-02,4.000,4.200,4.500,4.800,20.0,50.0,80.0,30.0,60.0,30.0");

console.log(
  JSON.stringify(
    {
      classificationsVerified: expectedClassifications.length,
      completedPeriodRuleVerified: true,
      nonObservationEventRuleVerified: true,
      statisticsVerified: true,
      csvUnitsVerified: true
    },
    null,
    2
  )
);
