import { writeFile as fsWriteFile, mkdir as fsMkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const DEFAULT_LIVE_URL = "https://allocations.kdubs.tech/stocks.json";

// Computed lazily for the same reason as generate-stock-data.js's
// getDefaultOutputPath - not safe to construct from import.meta.url at
// module-load time, since that would run just from a test file importing
// this module.
function getDefaultOutputPath() {
  return fileURLToPath(new URL("../src/data/stocks.json", import.meta.url));
}

/**
 * Downloads the already-generated stock data from the live deployed site
 * instead of regenerating it locally. This exists purely as a
 * local-development convenience: CI's own build (generate-stock-data.js)
 * already fetches stocks.jseeeweaver.cc and Finnhub for real and publishes
 * a copy of its output as a plain static file on the live site
 * (generate-stock-data.js's publicOutputPath) - so a developer whose home
 * network can't reach stocks.jseeeweaver.cc directly (see design.md) can
 * still get real data to work with locally by copying it from there
 * instead, with no Finnhub API key and no rate limiting involved at all.
 *
 * Never used by CI or by generate-stock-data.js itself - this is a
 * separate, deliberately much simpler script (fetch JSON, sanity-check its
 * shape, write it) run only via `npm run generate:data:live`.
 *
 * @param {object} options
 * @param {string} [options.sourceUrl]
 * @param {string} [options.outputPath]
 * @param {typeof fetch} [options.fetchImpl]
 * @param {(path: string, contents: string) => Promise<void>} [options.writeFile]
 * @param {(path: string, options: { recursive: boolean }) => Promise<void>} [options.mkdir]
 * @returns {Promise<{ generatedAt: string, stocks: Array<object> }>}
 */
export async function fetchLiveStockData({
  sourceUrl = DEFAULT_LIVE_URL,
  outputPath = getDefaultOutputPath(),
  fetchImpl = fetch,
  writeFile = fsWriteFile,
  mkdir = fsMkdir,
}) {
  const response = await fetchImpl(sourceUrl);
  if (!response.ok) {
    throw new Error(
      `fetchLiveStockData: failed to fetch ${sourceUrl} - received ${response.status}`,
    );
  }

  const payload = await response.json();
  if (!Array.isArray(payload?.stocks)) {
    throw new Error(
      `fetchLiveStockData: response from ${sourceUrl} did not look like stock data (missing a "stocks" array)`,
    );
  }

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, JSON.stringify(payload, null, 2));
  return payload;
}

// The real CLI entry point - only runs when this file is executed
// directly (e.g. `node scripts/fetch-live-stock-data.js`), not when it's
// imported by a test. See generate-stock-data.js's own CLI guard for the
// same reasoning.
if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    const { generatedAt, stocks } = await fetchLiveStockData({});
    console.log(
      `Wrote ${stocks.length} stocks to src/data/stocks.json (fetched from the live site, generated ${generatedAt})`,
    );
  } catch (error) {
    console.error(error.message ?? error);
    process.exit(1);
  }
}
