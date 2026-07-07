import assert from "node:assert/strict";
import { getHistoricalYieldData } from "../server/historicalClient.js";
import { getTreasuryYieldData } from "../server/treasuryClient.js";

const approxEqual = (actual, expected, label) => {
  assert.equal(Number(actual).toFixed(3), Number(expected).toFixed(3), label);
};

const assertSpread = (row, key, high, low) => {
  if (typeof row[high] !== "number" || typeof row[low] !== "number") return;
  const expected = Math.round((row[high] - row[low]) * 1000) / 10;
  assert.equal(row[key], expected, `${key} should equal (${high} - ${low}) * 100`);
};

const treasury = await getTreasuryYieldData();
const historical = await getHistoricalYieldData();

assert.ok(treasury.source.recordDate, "Treasury record date is required");
assert.ok(treasury.source.previousRecordDate, "Treasury previous record date is required");
assert.ok(treasury.source.feedUpdatedAt, "Treasury feed timestamp is required");
assert.equal(treasury.summary.length, 4, "Dashboard requires four current maturities");
assert.equal(treasury.history["2Y"].length > 200, true, "One-year Treasury history should include business-day observations");

const summaryByKey = Object.fromEntries(treasury.summary.map((item) => [item.key, item]));
for (const key of ["2Y", "5Y", "10Y", "30Y"]) {
  assert.ok(summaryByKey[key], `${key} current summary exists`);
  assert.equal(typeof summaryByKey[key].value, "number", `${key} value is numeric`);
  const change = (summaryByKey[key].value - summaryByKey[key].previousValue) * 100;
  approxEqual(summaryByKey[key].changeBps, change, `${key} daily bps change`);
}

const latestHistoryRow = historical.rows.at(-1);
assert.ok(latestHistoryRow, "Historical rows are required");
assert.equal(historical.source.recordEndDate, latestHistoryRow.date, "Historical source end date should match latest row");
assert.equal(historical.availability["5Y"].firstDate, "1962-01-02", "5Y history should start in 1962");
assert.equal(historical.availability["10Y"].firstDate, "1962-01-02", "10Y history should start in 1962");
assert.equal(historical.availability["2Y"].firstDate, "1976-06-01", "2Y history should start in 1976");
assert.equal(historical.availability["30Y"].firstDate, "1977-02-15", "30Y history should start in 1977");

assertSpread(latestHistoryRow, "10Y2Y", "10Y", "2Y");
assertSpread(latestHistoryRow, "30Y2Y", "30Y", "2Y");
assertSpread(latestHistoryRow, "10Y5Y", "10Y", "5Y");
assertSpread(latestHistoryRow, "30Y5Y", "30Y", "5Y");
assertSpread(latestHistoryRow, "5Y2Y", "5Y", "2Y");
assertSpread(latestHistoryRow, "30Y10Y", "30Y", "10Y");
assertSpread(latestHistoryRow, "10Y3M", "10Y", "3M");

for (const point of treasury.summary) {
  approxEqual(latestHistoryRow[point.key], point.value, `Latest historical ${point.key} should match Treasury supplement`);
}

console.log(
  JSON.stringify(
    {
      treasuryRecordDate: treasury.source.recordDate,
      treasuryValues: treasury.summary.map(({ key, value, changeBps }) => ({ key, value, changeBps })),
      historicalStart: historical.source.recordStartDate,
      historicalEnd: historical.source.recordEndDate,
      historicalRows: historical.rows.length,
      latestSpreads: {
        "5Y2Y": latestHistoryRow["5Y2Y"],
        "10Y2Y": latestHistoryRow["10Y2Y"],
        "30Y2Y": latestHistoryRow["30Y2Y"],
        "10Y5Y": latestHistoryRow["10Y5Y"],
        "30Y5Y": latestHistoryRow["30Y5Y"],
        "30Y10Y": latestHistoryRow["30Y10Y"],
        "10Y3M": latestHistoryRow["10Y3M"]
      }
    },
    null,
    2
  )
);
