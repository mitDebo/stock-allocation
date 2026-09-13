import { describe, it, expect, vi } from "vitest";
import { fetchLiveStockData } from "../../../scripts/fetch-live-stock-data.js";

// Purely a local-development convenience (see design.md): a developer whose
// home network can't reach stocks.jseeeweaver.cc directly can still get real
// stock data to work with by downloading the already-generated copy that
// the live site serves statically (see generate-stock-data.js's
// publicOutputPath), rather than regenerating it via Finnhub. Never used in
// CI - the real generate:data script is what CI runs.
function fakeOkResponse(body) {
  return { ok: true, status: 200, json: async () => body };
}

function fakeFailedResponse(status) {
  return { ok: false, status, json: async () => ({}) };
}

const fakePayload = {
  generatedAt: "2026-09-12T00:00:00.000Z",
  stocks: [{ symbol: "AAA", profile: { name: "Aaa Corp" } }],
};

describe("fetchLiveStockData", () => {
  it("fetches the live JSON and writes it to the given output path", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(fakeOkResponse(fakePayload));
    const writeFile = vi.fn().mockResolvedValue(undefined);
    const mkdir = vi.fn().mockResolvedValue(undefined);

    const result = await fetchLiveStockData({
      sourceUrl: "https://allocations.kdubs.tech/stocks.json",
      outputPath: "/tmp/stocks.json",
      fetchImpl,
      writeFile,
      mkdir,
    });

    expect(fetchImpl).toHaveBeenCalledWith("https://allocations.kdubs.tech/stocks.json");
    expect(writeFile).toHaveBeenCalledTimes(1);

    const [outputPath, contents] = writeFile.mock.calls[0];
    expect(outputPath).toBe("/tmp/stocks.json");
    expect(JSON.parse(contents)).toEqual(fakePayload);
    expect(result).toEqual(fakePayload);
  });

  it("creates the output directory if it doesn't exist yet, before writing the file", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(fakeOkResponse(fakePayload));
    const writeFile = vi.fn().mockResolvedValue(undefined);
    const mkdir = vi.fn().mockResolvedValue(undefined);

    await fetchLiveStockData({
      sourceUrl: "https://allocations.kdubs.tech/stocks.json",
      outputPath: "/tmp/some/nested/dir/stocks.json",
      fetchImpl,
      writeFile,
      mkdir,
    });

    expect(mkdir).toHaveBeenCalledWith("/tmp/some/nested/dir", { recursive: true });
    expect(mkdir.mock.invocationCallOrder[0]).toBeLessThan(
      writeFile.mock.invocationCallOrder[0],
    );
  });

  it("rejects and never writes anything when the live site can't be reached", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(fakeFailedResponse(502));
    const writeFile = vi.fn().mockResolvedValue(undefined);

    await expect(
      fetchLiveStockData({
        sourceUrl: "https://allocations.kdubs.tech/stocks.json",
        outputPath: "/tmp/stocks.json",
        fetchImpl,
        writeFile,
      }),
    ).rejects.toThrow(/502/);

    expect(writeFile).not.toHaveBeenCalled();
  });

  it("rejects and never writes anything when the response doesn't look like stock data", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(fakeOkResponse({ oops: "not stock data" }));
    const writeFile = vi.fn().mockResolvedValue(undefined);

    await expect(
      fetchLiveStockData({
        sourceUrl: "https://allocations.kdubs.tech/stocks.json",
        outputPath: "/tmp/stocks.json",
        fetchImpl,
        writeFile,
      }),
    ).rejects.toThrow(/stocks/);

    expect(writeFile).not.toHaveBeenCalled();
  });
});
