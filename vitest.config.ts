import path from "node:path";
import { defineConfig } from "vitest/config";

// Phase 20 — unit tests run without a DB; integration tests use DATABASE_URL
// and skip gracefully when it is unreachable (see tests/integration/*).
export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
  test: {
    environment: "node",
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/unit/**/*.test.ts", "tests/integration/**/*.test.ts"],
    testTimeout: 30000,
  },
});
