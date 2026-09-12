import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// @testing-library/react only auto-registers its afterEach(cleanup) when
// afterEach exists as a GLOBAL, which it doesn't here (vite.config.ts has
// no test.globals), so without this every test after the first accumulates
// the previous tests' rendered DOM instead of starting from a clean slate.
afterEach(() => {
  cleanup();
});

// jsdom does no real layout - every element reports a zero-sized bounding
// box. Base UI's Slider measures its own control/thumb elements to work
// out where to draw the thumb, and a 0/0 division produces NaN, which it
// treats as "no measurement yet" and leaves the thumb permanently
// invisible (and so invisible to accessibility queries too). Returning a
// fixed, non-zero rect is enough for that math to produce a real number.
const fixedRect = () => ({
  width: 200,
  height: 20,
  top: 0,
  left: 0,
  right: 200,
  bottom: 20,
  x: 0,
  y: 0,
  toJSON() {
    return this;
  },
});
Element.prototype.getBoundingClientRect = fixedRect;

// jsdom has no ResizeObserver at all. Components (Base UI's Slider among
// them) feature-detect it and just skip their positioning logic without
// it, so a minimal stub keeps that code path exercised instead of
// silently short-circuited.
if (typeof globalThis.ResizeObserver === "undefined") {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

// jsdom doesn't implement window.matchMedia at all. Motion (CardStack's
// entrance animation) checks prefers-reduced-motion internally, and
// calling code that isn't expecting `undefined` back throws - a fixed
// "no preference" stub is enough to keep that check harmless in tests.
if (typeof window !== "undefined" && !window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList;
}
