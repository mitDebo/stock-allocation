import { writeFile as fsWriteFile, mkdir as fsMkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

import { parseStockList } from "./lib/parse-stock-list.js";
import { getCompanyProfile as realGetCompanyProfile } from "./lib/get-company-profile.js";

const DEFAULT_SOURCE_URL = "https://stocks.jseeeweaver.cc";

// Computed lazily (only when actually called, via the default parameter
// below) rather than as a module-level constant - constructing this from
// import.meta.url at module-load time would run on every import,
// including when the test suite merely imports this file, which isn't
// safe to do outside a real CLI invocation.
function getDefaultOutputPath() {
  return fileURLToPath(new URL("../src/data/stocks.json", import.meta.url));
}

// Finnhub's free tier caps requests at 60/minute (confirmed via its own
// rate-limit response headers — see design.md). A real CI run showed
// that even a burst of 55 concurrent requests (well under that
// per-minute number) is enough to trip a 429 - so batching under the
// limit isn't sufficient, requests can never burst at all. Processing
// strictly one at a time with a real delay between each individual
// request keeps the pace to ~50/minute with zero burst.
const REQUEST_DELAY_MS = 1_200;

function defaultDelay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Produces the full enriched stock data array: parses the source page's
 * HTML into raw stock stats (preserving its existing rank order), then
 * looks up each stock's Finnhub company profile and attaches it.
 *
 * Finnhub lookups are made strictly one at a time, with a real delay
 * between each one (see REQUEST_DELAY_MS above), rather than fired all
 * at once via a single Promise.all — the source list can have well
 * over 60 stocks, and even a burst of concurrent requests well under
 * Finnhub's 60/minute free-tier cap has been observed to trip its rate
 * limiting.
 *
 * This is the testable core of the data-generation script — it takes
 * already-fetched HTML and an injected profile lookup rather than doing
 * any network I/O itself, so it can be exercised with fixtures (see the
 * integration test) instead of hitting stocks.jseeeweaver.cc or Finnhub
 * for real. runGenerateStockData, below, is the real I/O wrapper around
 * this.
 *
 * @param {object} options
 * @param {string} options.html - the stocks.jseeeweaver.cc page HTML
 * @param {(symbol: string) => Promise<object|null>} options.getCompanyProfile
 * @param {(ms: number) => Promise<void>} [options.delay] - injectable for
 *   testing; defaults to a real setTimeout-based delay.
 * @returns {Promise<Array<object>>}
 */
export async function generateStockData({ html, getCompanyProfile, delay = defaultDelay }) {
  const stocks = parseStockList(html);
  const results = [];

  for (let i = 0; i < stocks.length; i++) {
    if (i > 0) {
      await delay(REQUEST_DELAY_MS);
    }

    const stock = stocks[i];
    results.push({
      ...stock,
      profile: await getCompanyProfile(stock.symbol),
    });
  }

  return results;
}

/**
 * The real I/O wrapper around generateStockData: fetches the source
 * page, enriches it via Finnhub, and writes the result (wrapped with a
 * generation timestamp) to disk. Every real dependency - fetch, the
 * Finnhub lookup, writing the file, "what time is it right now" - is
 * injectable, defaulting to the real thing, so this function's actual
 * branching logic (a failed fetch, a malformed page, the happy path) is
 * fully unit-testable with fakes instead of touching the network or
 * filesystem for real (see design.md). Any failure - a network error, a
 * non-ok response, or parseStockList's own thrown errors on a malformed
 * or empty page - simply rejects; it's the CLI guard below that turns a
 * rejection into a loud, non-zero-exit failure.
 *
 * @param {object} options
 * @param {string} [options.sourceUrl]
 * @param {string} [options.outputPath]
 * @param {string} options.apiKey - Finnhub API key
 * @param {typeof fetch} [options.fetchImpl]
 * @param {typeof realGetCompanyProfile} [options.getCompanyProfile]
 * @param {(path: string, contents: string) => Promise<void>} [options.writeFile]
 * @param {(path: string, options: { recursive: boolean }) => Promise<void>} [options.mkdir] -
 *   a fresh checkout (e.g. a CI runner) has no src/data/ directory at all,
 *   since stocks.json is gitignored and nothing else lives there to make
 *   git track the directory itself - so the output directory has to be
 *   created before writing into it, not assumed to already exist.
 * @param {() => string} [options.now]
 * @returns {Promise<{ generatedAt: string, stocks: Array<object> }>}
 */
export async function runGenerateStockData({
  sourceUrl = DEFAULT_SOURCE_URL,
  outputPath = getDefaultOutputPath(),
  apiKey,
  fetchImpl = fetch,
  getCompanyProfile = realGetCompanyProfile,
  writeFile = fsWriteFile,
  mkdir = fsMkdir,
  now = () => new Date().toISOString(),
}) {
  const response = await fetchImpl(sourceUrl);
  if (!response.ok) {
    throw new Error(
      `runGenerateStockData: failed to fetch ${sourceUrl} - received ${response.status}`,
    );
  }
  const html = await response.text();

  const stocks = await generateStockData({
    html,
    getCompanyProfile: (symbol) => getCompanyProfile(symbol, { apiKey, fetchImpl }),
  });

  const payload = { generatedAt: now(), stocks };
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, JSON.stringify(payload, null, 2));
  return payload;
}

// The real CLI entry point - only runs when this file is executed
// directly (e.g. `node scripts/generate-stock-data.js`), not when it's
// imported by a test. Wires up the one real dependency that isn't
// already a sensible default above (the Finnhub API key, which only
// exists as an environment variable) and turns a rejection into a
// loud, non-zero exit rather than an unhandled promise rejection.
if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    const { generatedAt, stocks } = await runGenerateStockData({
      apiKey: process.env.FINNHUB_API_KEY,
    });
    console.log(
      `Wrote ${stocks.length} stocks to src/data/stocks.json (generated ${generatedAt})`,
    );
  } catch (error) {
    console.error(error.message ?? error);
    if (error.cause) console.error("Cause:", error.cause);
    process.exit(1);
  }
}
