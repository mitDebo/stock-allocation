import type { SourceStock } from "./allocate";

/**
 * Returns the top N stocks from the synced list's existing rank order -
 * a plain slice, never a re-sort. The synced list is already ordered by
 * the source site's own ranking (its lower-bound-slope statistic), so
 * "top N" just means "the first N entries."
 */
export function selectTopN(stocks: SourceStock[], n: number): SourceStock[] {
  return stocks.slice(0, n);
}
