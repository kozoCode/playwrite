import { test, expect } from '@playwright/test';
import { StatsHelper } from './utils/stats-helper';
import { ResultsReporter, IterationResult } from './utils/results-reporter';
import { ABTestReporter } from './utils/ab-test-reporter';
import * as path from 'path';

// ============================================================================
// CONFIGURATION
// ============================================================================

const TOTAL_ITERATIONS = parseInt(process.env.TOTAL_ITERATIONS || '200', 10);

/**
 * URL d'entrée qui déclenche l'A/B test.
 * Le système redirige vers lp.norauto.es ou www.norauto.es.
 * TODO: Remplacer par l'URL fournie par l'équipe métier.
 */
const TEST_URL = process.env.TEST_URL || 'https://www.norauto.es/';

const EXPECTED_LP_PROPORTION = 0.5;

const resultsDir = path.join(__dirname, '..', 'results');

// ============================================================================
// TEST SUITE
// ============================================================================

test.describe('A/B Test Split Verification - Norauto ES', () => {
  const reporter = new ResultsReporter('NORAUTO ES A/B TEST SPLIT');
  const abReporter = new ABTestReporter();

  for (let i = 1; i <= TOTAL_ITERATIONS; i++) {
    test(`Iteration ${i}/${TOTAL_ITERATIONS} - A/B Split & eVar157`, async ({ browser }, testInfo) => {
      const startTime = Date.now();
      const browserName = testInfo.project.name;

      const context = await browser.newContext();
      const page = await context.newPage();

      const throttle = (testInfo.project.metadata as any)?.throttle;
      if (throttle === '3g' && browserName.includes('chromium')) {
        const cdpSession = await context.newCDPSession(page);
        await cdpSession.send('Network.emulateNetworkConditions', {
          offline: false,
          downloadThroughput: (1.5 * 1024 * 1024) / 8,
          uploadThroughput: (750 * 1024) / 8,
          latency: 100,
        });
      }

      const statsHelper = new StatsHelper();
      statsHelper.setupInterception(page);

      try {
        // Navigation vers l'URL de test
        await page.goto(TEST_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });

        // Déterminer la variante via l'URL finale
        const finalUrl = page.url();
        let variant: 'lp' | 'www' | 'unknown' = 'unknown';

        if (finalUrl.includes('lp.norauto.es')) {
          variant = 'lp';
        } else if (finalUrl.includes('www.norauto.es')) {
          variant = 'www';
        }

        // Gérer la bannière de consentement
        const consentButton = page.locator('#onetrust-accept-btn-handler')
          .or(page.locator('[data-testid="consent-accept"]'))
          .or(page.locator('button:has-text("Aceptar")'));

        const consentTimeout = throttle === '3g' ? 20000 : 10000;
        try {
          await consentButton.waitFor({ timeout: consentTimeout });
          await consentButton.click();
        } catch {
          console.log(`Iteration ${i}: Bannière de consentement non trouvée`);
        }

        // Attendre les hits analytics asynchrones
        const waitTime = throttle === '3g' ? 10000 : 5000;
        await page.waitForTimeout(waitTime);

        // Extraire les données des hits interceptés
        const allHits = statsHelper.getHits();
        const hitWithDimensions = statsHelper.getHitWithDimensions();
        const lastHit = statsHelper.getLastHit();

        const aid = statsHelper.extractAid(lastHit);
        const evar157 = statsHelper.extractEvar157(hitWithDimensions || lastHit);

        const loadTime = Date.now() - startTime;

        const passed = variant !== 'unknown';
        const result: IterationResult = {
          iteration: i,
          passed,
          aid,
          loadTime,
          hitUrl: lastHit?.url,
          browser: browserName,
          variant,
          finalUrl,
          evar157,
        };
        reporter.addResult(result);

        expect.soft(variant, `Variante indéterminée pour URL: ${finalUrl}`).not.toBe('unknown');
        expect.soft(evar157, `eVar157 absent sur itération ${i}`).toBeDefined();

        console.log(
          `#${String(i).padStart(3, '0')}: variant=${variant} | evar157=${evar157 || 'N/A'} | ` +
          `url=${finalUrl} | hits=${allHits.length} | ${loadTime}ms`
        );

      } finally {
        await context.close();
      }
    });
  }

  test.afterAll(async () => {
    reporter.printConsoleReport();
    reporter.exportToJSON(resultsDir);
    reporter.exportToCSV(resultsDir);

    const results = reporter.getResults().results;
    const stats = abReporter.analyze(results, EXPECTED_LP_PROPORTION);
    abReporter.printReport(stats);

    // Verdict final si suffisamment de données
    if (stats.lpCount + stats.wwwCount >= 30) {
      if (stats.isSignificant) {
        console.log(
          `⚠ ATTENTION: Le split dévie significativement du ratio attendu ` +
          `${EXPECTED_LP_PROPORTION * 100}/${(1 - EXPECTED_LP_PROPORTION) * 100}. ` +
          `Vérifiez la configuration de l'A/B test.`
        );
      } else {
        console.log(
          `✓ PASS: Le split est cohérent avec le ratio attendu ` +
          `${EXPECTED_LP_PROPORTION * 100}/${(1 - EXPECTED_LP_PROPORTION) * 100}.`
        );
      }
    }
  });
});
