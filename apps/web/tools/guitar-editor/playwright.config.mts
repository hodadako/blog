import { defineConfig, devices } from "@playwright/test";
import { mkdtempSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";

const here = path.dirname(fileURLToPath(import.meta.url));
const fixtureRoot = mkdtempSync(path.join(tmpdir(), "hodako-guitar-editor-e2e-"));
process.env.GUITAR_EDITOR_CONTENT_ROOT = fixtureRoot;

export default defineConfig({
  testDir: path.join(here, "e2e"),
  globalSetup: path.join(here, "setup.ts"),
  globalTeardown: path.join(here, "teardown.ts"),
  reporter: "list",
  use: { ...devices["Desktop Chrome"], baseURL: "http://127.0.0.1:4174" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "pnpm guitar:editor",
    url: "http://127.0.0.1:4174",
    reuseExistingServer: false,
    timeout: 30_000,
    env: { GUITAR_EDITOR_CONTENT_ROOT: fixtureRoot },
  },
});
