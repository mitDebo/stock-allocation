import * as cheerio from "cheerio";

// stocks.jseeeweaver.cc's page has two <table> elements: the first is a
// single-cell layout wrapper holding the intro/disclaimer text, the
// second is the actual 13-column data grid (confirmed by inspecting the
// live page — not an assumption). We target the second one explicitly
// rather than "the first table on the page".
const DATA_TABLE_INDEX = 1;

// Column order, left to right, as published on the source page.
const COLUMNS = [
  "symbol",
  "lowerBoundSlope",
  "normalizedSlope",
  "r2",
  "percentGrowth",
  "first",
  "last",
  "min",
  "avg",
  "max",
  "periodStart",
  "periodStop",
  "investorGrade",
];

// Columns whose text should stay a string rather than being coerced to a
// number (the ticker symbol and the two period dates).
const STRING_COLUMNS = new Set(["symbol", "periodStart", "periodStop"]);

/**
 * Parses the stocks.jseeeweaver.cc HTML page into an array of stock stat
 * objects, in the same order as the source table (already ranked by
 * lower-bound slope — this function does not re-sort). Does not fetch
 * anything or add market/company-profile data; see generate-stock-data.js
 * for the enrichment step that adds that on top of this.
 *
 * @param {string} html
 * @returns {Array<object>}
 */
export function parseStockList(html) {
  const $ = cheerio.load(html);
  const dataTable = $("table").eq(DATA_TABLE_INDEX);

  if (dataTable.length === 0) {
    throw new Error(
      "parseStockList: expected a second <table> (the data grid) on the " +
        "source page, but found none. The page may be empty, unreachable, " +
        "or its structure may have changed — refusing to deploy with no data " +
        "rather than silently produce an empty stock list.",
    );
  }

  const dataRows = dataTable.find("tr").slice(1); // skip the header row

  if (dataRows.length === 0) {
    throw new Error(
      "parseStockList: found the data table, but it has no rows besides " +
        "the header. Refusing to treat this as a genuinely empty filtered " +
        "list, since a structure change on the source page is far more " +
        "likely than the list actually having zero stocks.",
    );
  }

  return dataRows
    .map((_, row) => {
      const cells = $(row).find("td");

      const stock = {};
      COLUMNS.forEach((column, index) => {
        const text = $(cells[index]).text().trim();
        stock[column] = STRING_COLUMNS.has(column) ? text : Number(text);
      });
      return stock;
    })
    .get();
}
