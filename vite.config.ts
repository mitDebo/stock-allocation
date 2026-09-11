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
    // environmentMatchGlobs (a single `environment` + per-glob overrides)
    // was deprecated back in Vitest 3 - current Vitest configures this via
    // `projects` instead: each project is its own independent test run
    // with its own `include`/`environment`, sharing this same Vite config.
    projects: [
      {
        // The plain-Node data-generation script's tests (section 2-3) -
        // no DOM needed.
        test: {
          name: "node",
          environment: "node",
          include: ["test/**/*.test.{js,ts}"],
        },
      },
      {
        // React component tests (section 4.3+) - needs jsdom to provide
        // `document`, plus the jest-dom matchers setup file.
        test: {
          name: "jsdom",
          environment: "jsdom",
          include: ["src/**/*.test.{ts,tsx}"],
          setupFiles: ["./src/test-setup.ts"],
        },
      },
    ],
  },
});
