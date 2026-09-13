import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DataFreshness } from "../../../src/components/DataFreshness";

describe("DataFreshness", () => {
  it("shows the data's generation date on page load, without any interaction", () => {
    render(<DataFreshness generatedAt="2026-09-12T00:00:00.000Z" />);

    expect(screen.getByText(/September 12, 2026/)).toBeInTheDocument();
  });
});
