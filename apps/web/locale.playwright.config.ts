import {defineConfig, devices} from "@playwright/test";

const externalBaseURL = process.env.PLAYWRIGHT_BASE_URL;
const baseURL = externalBaseURL || "http://localhost:4318";

export default defineConfig({
  testDir: "./e2e",
  testMatch: "locale.e2e-spec.ts",
  use: {baseURL, ...devices["Desktop Chrome"]},
  webServer: externalBaseURL ? undefined : {
    command: "pnpm exec next start --hostname 127.0.0.1 --port 4318",
    url: `${baseURL}/ko/blog`,
    reuseExistingServer: false,
  },
});
