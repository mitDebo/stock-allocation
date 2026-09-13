const FINNHUB_BASE_URL = "https://finnhub.io/api/v1";

/**
 * Looks up a symbol's company profile via Finnhub's /stock/profile2
 * endpoint (confirmed free-tier — see openspec design.md). Returns the
 * full profile response (market cap, name, industry, exchange, etc.),
 * or null if Finnhub has no profile for the symbol.
 *
 * Finnhub signals "no data for this symbol" by returning an empty JSON
 * object ({}) with a 200 status, not an HTTP error — this function is
 * what translates that into null for the rest of the app.
 *
 * @param {string} symbol
 * @param {object} options
 * @param {string} options.apiKey
 * @param {typeof fetch} [options.fetchImpl] - injectable for testing;
 *   defaults to the global fetch for real use.
 * @returns {Promise<object|null>}
 */
export async function getCompanyProfile(symbol, { apiKey, fetchImpl = fetch }) {
  const url = `${FINNHUB_BASE_URL}/stock/profile2?symbol=${encodeURIComponent(symbol)}&token=${apiKey}`;
  const response = await fetchImpl(url);

  if (!response.ok) {
    throw new Error(
      `getCompanyProfile: Finnhub request for ${symbol} failed - received ${response.status}`,
    );
  }

  const data = await response.json();

  return Object.keys(data).length === 0 ? null : data;
}
