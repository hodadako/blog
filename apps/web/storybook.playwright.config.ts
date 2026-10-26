import { defineConfig, devices } from "@playwright/test";
const baseURL = process.env.STORYBOOK_URL ?? "http://127.0.0.1:6006";
const port = new URL(baseURL).port || "6006";
export default defineConfig({
  testDir: "./e2e",
  testMatch: "storybook.e2e-spec.ts",
  workers: 1,
  outputDir: "test-results/storybook",
  snapshotPathTemplate: "{testDir}/storybook-snapshots/{platform}/{arg}{ext}",
  use: {
    baseURL,
    ...devices["Desktop Chrome"],
    reducedMotion: "reduce",
    trace: "retain-on-failure",
  },
  expect: {
    toHaveScreenshot: { animations: "disabled", maxDiffPixelRatio: 0.002 },
  },
  webServer: {
    command: `pnpm exec storybook dev --host 127.0.0.1 --port ${port} --ci --disable-telemetry --no-open`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
