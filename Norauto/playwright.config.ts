import { defineConfig, devices } from '@playwright/test';

// Regular 3G network conditions (moins agressif que Slow 3G)
const regular3G = {
  offline: false,
  downloadThroughput: (1.5 * 1024 * 1024) / 8, // 1.5 Mbps
  uploadThroughput: (750 * 1024) / 8, // 750 Kbps
  latency: 100, // 100ms
};

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 3,
  reporter: 'html',
  timeout: 180000, // Increased for slow network
  use: {
    baseURL: 'https://www.norauto.es',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'chromium-3g',
      use: {
        ...devices['Desktop Chrome'],
        // Network throttling via CDP
      },
      metadata: { throttle: '3g' },
    },
  ],
});
