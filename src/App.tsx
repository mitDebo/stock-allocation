import { AllocationPage } from "@/components/AllocationPage";
import type { SourceStock } from "@/lib/allocate";

// Placeholder data until the real synced-list pipeline
// (scripts/generate-stock-data.js) is wired into the app - not part of
// the allocation-engine change. AllocationPage itself is the real,
// fully-tested thing now; this is just what feeds it for the moment.
const SAMPLE_STOCKS: SourceStock[] = [
  {
    symbol: "AAPL",
    lowerBoundSlope: 0.62,
    normalizedSlope: 0.58,
    r2: 0.91,
    percentGrowth: 12.4,
    first: 180,
    last: 202.15,
    min: 175,
    avg: 190,
    max: 205,
    periodStart: "2026-08-01",
    periodStop: "2026-09-01",
    investorGrade: 88,
    profile: { marketCapitalization: 3_100_000_000_000 },
  },
  {
    symbol: "MSFT",
    lowerBoundSlope: 0.45,
    normalizedSlope: 0.4,
    r2: 0.87,
    percentGrowth: 6.1,
    first: 410,
    last: 435.02,
    min: 400,
    avg: 420,
    max: 440,
    periodStart: "2026-08-01",
    periodStop: "2026-09-01",
    investorGrade: 82,
    profile: { marketCapitalization: 3_300_000_000_000 },
  },
  {
    symbol: "PLTR",
    lowerBoundSlope: 0.9,
    normalizedSlope: 0.95,
    r2: 0.78,
    percentGrowth: -3.8,
    first: 30,
    last: 28.86,
    min: 27,
    avg: 29,
    max: 32,
    periodStart: "2026-08-01",
    periodStop: "2026-09-01",
    investorGrade: 61,
    profile: null,
  },
];

function App() {
  return <AllocationPage stocks={SAMPLE_STOCKS} />;
}

export default App;
