import { defineConfig, devices } from '@playwright/test';

const ENV = process.env.ENV || 'prod';

const envConfig = {
  prod: {
    baseURL: 'https://www.carter-cash.com',
  },
  preprod: {
    baseURL: 'https://recette.carter-cash.com',
  },
};

// Validation de l'environnement
if (!(ENV in envConfig)) {
  throw new Error(`Invalid ENV: ${ENV}. Must be one of: ${Object.keys(envConfig).join(', ')}`);
}

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 2,
  reporter: 'html',

  // Timeouts globaux
  timeout: 60000, // 60 secondes par test
  expect: {
    timeout: 10000, // 10 secondes pour les assertions
  },

  use: {
    baseURL: envConfig[ENV as keyof typeof envConfig].baseURL,
    trace: 'on-first-retry',
    navigationTimeout: 30000, // 30 secondes pour la navigation
    actionTimeout: 10000, // 10 secondes pour les actions
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        serviceWorkers: 'block', // Désactiver les Service Workers pour l'interception
      },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
});
