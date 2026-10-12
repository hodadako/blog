import {defineConfig, devices} from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:4319";
export default defineConfig({
  testDir: "./e2e",
  testMatch: "blog-p2.e2e-spec.ts",
  workers: 1,
  outputDir: "test-results/p2",
  use: {baseURL, ...devices["Desktop Chrome"], trace: "retain-on-failure"},
  webServer: process.env.PLAYWRIGHT_BASE_URL ? undefined : {
    command: "pnpm exec next start --hostname 127.0.0.1 --port 4319",
    url: `${baseURL}/ko/blog`,
    reuseExistingServer: false,
  },
});
