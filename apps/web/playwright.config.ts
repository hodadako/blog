import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://guitar.localhost:4317";
const port = new URL(baseURL).port || "4317";

export default defineConfig({
  testDir: "./e2e",
  testMatch: ["guitar.e2e.spec.ts", "guitar-editorial.e2e-spec.ts"],
  testIgnore: ["locale.e2e-spec.ts", "blog-p2.e2e-spec.ts"],
  fullyParallel: true,
  reporter: "list",
  use: {
    baseURL,
    trace: "retain-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
  ],
  webServer: {
    command: `pnpm exec next start --hostname 127.0.0.1 --port ${port}`,
    url: `http://127.0.0.1:${port}/ko`,
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
