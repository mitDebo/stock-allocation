/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
  test: {
    // Every test file lives under test/ now (unit tests and integration
    // tests alike, no more co-locating a test next to the source file it
    // covers), so there's no longer a need to split tests into separate
    // "projects" by directory. jsdom is a superset of plain Node (every
    // normal Node global is still there - jsdom just adds document/
    // window on top), so one environment covers both the plain
    // calculation-engine/script tests and the React component tests with
    // no real downside, and no test file's location has to line up with
    // any environment-matching config.
    environment: "jsdom",
    setupFiles: ["./test/setup.ts"],
  },
});
