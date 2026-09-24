import fs from "node:fs";
import path from "node:path";
import { defineConfig } from "@playwright/test";
import { NOW, OUT, PORT, ROOT, TIMEZONE } from "./config";

// Credentials for the account being photographed. Gitignored (.env*).
const envFile = path.join(ROOT, ".env.screenshots");
if (fs.existsSync(envFile)) process.loadEnvFile(envFile);

// NODE_OPTIONS splits on spaces unless a path is quoted, and this repo lives
// under "Code Projects/Interview Prep center".
const preload = (file: string) => `--require "${path.join(__dirname, "server", file)}"`;

export default defineConfig({
  testDir: __dirname,
  outputDir: path.join(OUT, ".cache", "test-results"),
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  workers: 4,
  reporter: [["list"]],
  use: {
    trace: "retain-on-failure",
    // A step that can't find its target fails with the locator named, instead
    // of the whole test running out of time with no clue which step hung.
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },

  webServer: {
    // The production build, started by the harness itself — never a server
    // that happens to be running already, because only this one carries the
    // read-only guard and the fixed clock.
    command: `node node_modules/next/dist/bin/next start -p ${PORT}`,
    cwd: ROOT,
    url: `http://localhost:${PORT}/login`,
    reuseExistingServer: false,
    timeout: 120_000,
    stdout: "ignore",
    stderr: "pipe",
    env: {
      TZ: TIMEZONE,
      SHOTS_NOW: NOW,
      NODE_OPTIONS: [preload("clock.cjs"), preload("db-readonly.cjs")].join(" "),
    },
  },

  projects: [
    { name: "setup", testMatch: /auth\.setup\.ts/ },
    { name: "capture", testMatch: /capture\.spec\.ts/, dependencies: ["setup"] },
    { name: "compose", testMatch: /compose\.spec\.ts/, dependencies: ["capture"], fullyParallel: false },
    // Its own target: `npm run shots:e2e` runs the journeys without re-shooting.
    { name: "e2e", testMatch: /e2e\.spec\.ts/, dependencies: ["setup"] },
    // README-sized copies into docs/screenshots (committed), from existing captures.
    { name: "readme", testMatch: /readme\.spec\.ts/ },
  ],
});
