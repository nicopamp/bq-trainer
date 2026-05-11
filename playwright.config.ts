import { defineConfig, devices } from "@playwright/test";
import { config } from "dotenv";

config({ path: ".env.local" });

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  retries: 1,
  workers: 1,
  reporter: "list",

  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },

  projects: [
    // Step 1: create the test user in Supabase
    { name: "global-setup", testMatch: "global.setup.ts" },

    // Step 2: sign in and save auth cookies
    {
      name: "auth-setup",
      testMatch: "auth.setup.ts",
      dependencies: ["global-setup"],
    },

    // Step 3: run all tests with the saved auth state
    {
      name: "chromium",
      use: {
        ...devices["Pixel 5"],              // mobile-first, matches the design
        storageState: "playwright/.auth/user.json",
      },
      dependencies: ["auth-setup"],
    },
  ],

  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 30_000,
  },
});
