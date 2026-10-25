import {defineConfig, devices} from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  testMatch: ["design-system.e2e-spec.ts", "tailwind-ui.e2e-spec.ts", "dropdown.e2e-spec.ts"],
  workers: 1,
  outputDir: "test-results/design-system",
  use: {
    ...devices["Desktop Chrome"],
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:4340",
    reducedMotion: "reduce",
    trace: "retain-on-failure",
  },
});
