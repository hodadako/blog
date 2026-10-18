import { defineConfig, devices } from "@playwright/test";

// Run against an isolated production build with the test environment in docs/adsense.md.
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:4332";
export default defineConfig({
  testDir: "./e2e", testMatch: "ads.e2e-spec.ts", workers: 1,
  outputDir: "test-results/ads", use: { baseURL, ...devices["Desktop Chrome"], trace: "retain-on-failure" },
  webServer: process.env.PLAYWRIGHT_BASE_URL ? undefined : {
    command: "pnpm exec next start --hostname 127.0.0.1 --port 4332",
    url: `${baseURL}/ko/blog`, reuseExistingServer: false,
  },
});
