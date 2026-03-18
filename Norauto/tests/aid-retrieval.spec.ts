import { test, expect } from '@playwright/test';
import { StatsHelper } from './utils/stats-helper';
import { ResultsReporter, IterationResult } from './utils/results-reporter';
import * as path from 'path';

const TOTAL_ITERATIONS = parseInt(process.env.TOTAL_ITERATIONS || '30', 10);
const resultsDir = path.join(__dirname, '..', 'results');

test.describe('AID Retrieval - Norauto ES', () => {
  const reporter = new ResultsReporter('NORAUTO ES AID RETRIEVAL');

  for (let i = 1; i <= TOTAL_ITERATIONS; i++) {
    test(`Iteration ${i}/${TOTAL_ITERATIONS} - Vérification AID RtbHouse`, async ({ browser }, testInfo) => {
      const startTime = Date.now();
      const browserName = testInfo.project.name;

      // Créer un nouveau contexte navigateur (sans cache)
      const context = await browser.newContext();
      const page = await context.newPage();

      // Appliquer le throttling réseau si configuré (Chromium uniquement via CDP)
      const throttle = (testInfo.project.metadata as any)?.throttle;
      if (throttle === '3g' && browserName.includes('chromium')) {
        const cdpSession = await context.newCDPSession(page);
        await cdpSession.send('Network.emulateNetworkConditions', {
          offline: false,
          downloadThroughput: (1.5 * 1024 * 1024) / 8, // 1.5 Mbps
          uploadThroughput: (750 * 1024) / 8, // 750 Kbps
          latency: 100, // 100ms
        });
      }

      // Configurer l'interception des hits
      const statsHelper = new StatsHelper();
      statsHelper.setupInterception(page);

      try {
        // Naviguer vers la page
        await page.goto('https://www.norauto.es/', { waitUntil: 'domcontentloaded', timeout: 60000 });

        // Attendre et cliquer sur la bannière de consentement
        const consentButton = page.locator('#onetrust-accept-btn-handler')
          .or(page.locator('[data-testid="consent-accept"]'))
          .or(page.locator('button:has-text("Aceptar")'));

        const consentTimeout = throttle === '3g' ? 20000 : 10000;
        await consentButton.waitFor({ timeout: consentTimeout });
        await consentButton.click();

        // Attendre pour les hits asynchrones (plus long en 3G)
        const waitTime = throttle === '3g' ? 10000 : 5000;
        await page.waitForTimeout(waitTime);

        // Parcourir TOUS les hits pour trouver l'AID
        const aid = statsHelper.findAid();
        const passed = aid !== undefined && aid !== null && aid !== '';

        const loadTime = Date.now() - startTime;

        // Enregistrer le résultat
        const result: IterationResult = {
          iteration: i,
          passed,
          aid,
          loadTime,
          hitUrl: statsHelper.getHits().at(-1)?.url,
          browser: browserName
        };
        reporter.addResult(result);

        // Assertion
        expect(passed, `AID devrait être présent. Valeur reçue: ${aid}`).toBe(true);

      } finally {
        await context.close();
      }
    });
  }

  test.afterAll(async () => {
    // Afficher le rapport console
    reporter.printConsoleReport();

    // Exporter les résultats
    reporter.exportToJSON(resultsDir);
    reporter.exportToCSV(resultsDir);
  });
});
