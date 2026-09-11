import { parseStockList } from "./lib/parse-stock-list.js";

/**
 * Produces the full enriched stock data array: parses the source page's
 * HTML into raw stock stats (preserving its existing rank order), then
 * looks up each stock's Finnhub company profile and attaches it.
 *
 * This is the testable core of the data-generation script — it takes
 * already-fetched HTML and an injected profile lookup rather than doing
 * any network I/O itself, so it can be exercised with fixtures (see the
 * integration test) instead of hitting stocks.jseeeweaver.cc or Finnhub
 * for real. The CLI entry point that does the real fetching and writes
 * the result to a file is added in section 6, once the Vite app exists
 * and its expected output path is known.
 *
 * @param {object} options
 * @param {string} options.html - the stocks.jseeeweaver.cc page HTML
 * @param {(symbol: string) => Promise<object|null>} options.getCompanyProfile
 * @returns {Promise<Array<object>>}
 */
export async function generateStockData({ html, getCompanyProfile }) {
  const stocks = parseStockList(html);

  return Promise.all(
    stocks.map(async (stock) => ({
      ...stock,
      profile: await getCompanyProfile(stock.symbol),
    })),
  );
}
