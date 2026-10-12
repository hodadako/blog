import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  testIgnore: ["locale.e2e-spec.ts", "blog-p2.e2e-spec.ts"],
  fullyParallel: true,
  reporter: "list",
  use: {
    baseURL: "http://guitar.localhost:4317",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
  ],
  webServer: {
    command: "pnpm exec next start --hostname 127.0.0.1 --port 4317",
    url: "http://127.0.0.1:4317/ko",
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
