import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Discover *.test.ts under tests/ and any colocated tests under src/
    include: ["tests/**/*.test.ts", "src/**/*.test.ts"],
    environment: "node",
    // Show full diffs on failure — large nested JSON objects are common in tool responses
    chaiConfig: { truncateThreshold: 0 },
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      exclude: ["src/**/*.test.ts", "src/index.ts"], // stdio entry isn't unit-testable
      reporter: ["text", "html"],
      // Don't fail on coverage thresholds today; ratchet up later.
    },
  },
});
