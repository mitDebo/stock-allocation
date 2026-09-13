import { describe, it, expect, vi } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { runGenerateStockData } from "../../../scripts/generate-stock-data.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const fixtureHtml = readFileSync(
  path.join(__dirname, "../../fixtures/stocks-list.html"),
  "utf-8",
);

const malformedHtml =
  "<html><body><p>stocks.jseeeweaver.cc is down or changed shape.</p></body></html>";

// Same dependency-injection shape as getCompanyProfile's own tests (see
// design.md): fetch, file-writing, and "what time is it" are all
// injectable fakes here, so this exercises the CLI's actual branching
// logic (happy path, a failed fetch, a malformed response) without ever
// touching the real network or filesystem - only the real
// `if (import.meta.url === ...)` guard at the bottom of the script
// wires up the real globals, and that's a manual/CLI check (3.6), not
// something asserted on here.
function fakeOkResponse(html) {
  return { ok: true, status: 200, text: async () => html };
}

function fakeFailedResponse(status) {
  return { ok: false, status, text: async () => "" };
}

async function fakeGetCompanyProfile(symbol) {
  return symbol === "AAA"
    ? { marketCapitalization: 3_100_000_000, name: "Aaa Corp" }
    : null;
}

describe("runGenerateStockData", () => {
  it("fetches the source page, enriches it, and writes { generatedAt, stocks } to the given path", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(fakeOkResponse(fixtureHtml));
    const writeFile = vi.fn().mockResolvedValue(undefined);
    const now = () => "2026-09-12T00:00:00.000Z";

    await runGenerateStockData({
      sourceUrl: "https://stocks.jseeeweaver.cc",
      outputPath: "/tmp/stocks.json",
      publicOutputPath: "/tmp/public-stocks.json",
      apiKey: "fake-key",
      fetchImpl,
      getCompanyProfile: fakeGetCompanyProfile,
      writeFile,
      now,
    });

    expect(fetchImpl).toHaveBeenCalledWith("https://stocks.jseeeweaver.cc");
    // Writes twice: once to the "real" location the app imports from
    // (src/data/stocks.json), and once more to a public, statically-served
    // copy (public/stocks.json) - see the "also writes a public copy" test
    // below for why the second copy exists.
    expect(writeFile).toHaveBeenCalledTimes(2);

    const [outputPath, contents] = writeFile.mock.calls[0];
    expect(outputPath).toBe("/tmp/stocks.json");

    const written = JSON.parse(contents);
    expect(written.generatedAt).toBe("2026-09-12T00:00:00.000Z");
    expect(written.stocks.map((s) => s.symbol)).toEqual(["AAA", "BBB", "CCC"]);
    expect(written.stocks[0].profile).toEqual({
      marketCapitalization: 3_100_000_000,
      name: "Aaa Corp",
    });
  });

  // The live site serves this public copy at /stocks.json - a developer
  // whose home network can't reach stocks.jseeeweaver.cc directly (see
  // design.md) can then fetch already-generated real data from the live
  // site instead (see fetch-live-stock-data.js) rather than being stuck
  // without any real data to work with locally.
  it("also writes an identical copy to the public output path, for the live site to serve statically", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(fakeOkResponse(fixtureHtml));
    const writeFile = vi.fn().mockResolvedValue(undefined);

    await runGenerateStockData({
      sourceUrl: "https://stocks.jseeeweaver.cc",
      outputPath: "/tmp/stocks.json",
      publicOutputPath: "/tmp/public-stocks.json",
      apiKey: "fake-key",
      fetchImpl,
      getCompanyProfile: fakeGetCompanyProfile,
      writeFile,
      now: () => "2026-09-12T00:00:00.000Z",
    });

    const [primaryPath, primaryContents] = writeFile.mock.calls[0];
    const [publicPath, publicContents] = writeFile.mock.calls[1];

    expect(primaryPath).toBe("/tmp/stocks.json");
    expect(publicPath).toBe("/tmp/public-stocks.json");
    expect(publicContents).toBe(primaryContents);
  });

  it("rejects and never writes anything when the source page can't be fetched", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(fakeFailedResponse(503));
    const writeFile = vi.fn().mockResolvedValue(undefined);

    await expect(
      runGenerateStockData({
        sourceUrl: "https://stocks.jseeeweaver.cc",
        outputPath: "/tmp/stocks.json",
        publicOutputPath: "/tmp/public-stocks.json",
        apiKey: "fake-key",
        fetchImpl,
        getCompanyProfile: fakeGetCompanyProfile,
        writeFile,
        now: () => "2026-09-12T00:00:00.000Z",
      }),
    ).rejects.toThrow(/503/);

    expect(writeFile).not.toHaveBeenCalled();
  });

  it("rejects and never writes anything when the fetched page is malformed", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(fakeOkResponse(malformedHtml));
    const writeFile = vi.fn().mockResolvedValue(undefined);

    await expect(
      runGenerateStockData({
        sourceUrl: "https://stocks.jseeeweaver.cc",
        outputPath: "/tmp/stocks.json",
        publicOutputPath: "/tmp/public-stocks.json",
        apiKey: "fake-key",
        fetchImpl,
        getCompanyProfile: fakeGetCompanyProfile,
        writeFile,
        now: () => "2026-09-12T00:00:00.000Z",
      }),
    ).rejects.toThrow(/expected a second <table>/);

    expect(writeFile).not.toHaveBeenCalled();
  });

  // A fresh checkout (e.g. a CI runner) has no src/data/ directory at all -
  // stocks.json is gitignored, and nothing else lives there to make git
  // track the directory itself. Discovered via a real CI failure: ENOENT
  // trying to write a file into a directory that was never created. The
  // same applies to the public output path's directory.
  it("creates each output directory if it doesn't exist yet, before writing to it", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(fakeOkResponse(fixtureHtml));
    const writeFile = vi.fn().mockResolvedValue(undefined);
    const mkdir = vi.fn().mockResolvedValue(undefined);

    await runGenerateStockData({
      sourceUrl: "https://stocks.jseeeweaver.cc",
      outputPath: "/tmp/some/nested/dir/stocks.json",
      publicOutputPath: "/tmp/another/nested/dir/stocks.json",
      apiKey: "fake-key",
      fetchImpl,
      getCompanyProfile: fakeGetCompanyProfile,
      writeFile,
      mkdir,
      now: () => "2026-09-12T00:00:00.000Z",
    });

    expect(mkdir).toHaveBeenCalledWith("/tmp/some/nested/dir", { recursive: true });
    expect(mkdir).toHaveBeenCalledWith("/tmp/another/nested/dir", { recursive: true });
    expect(mkdir.mock.invocationCallOrder[0]).toBeLessThan(
      writeFile.mock.invocationCallOrder[0],
    );
    expect(mkdir.mock.invocationCallOrder[1]).toBeLessThan(
      writeFile.mock.invocationCallOrder[1],
    );
  });
});
