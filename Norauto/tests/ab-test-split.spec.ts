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
 * URL d'entrée qui déclenche l'A/B test (Google Ads click URL).
 * La redirection atterrit toujours sur www.norauto.es ; la variante est
 * déterminée par les paramètres URL (dataiads_variation / lpo).
 */
const TEST_URL = process.env.TEST_URL || 'https://www.google.com/aclk?sa=L&ai=DChsSEwjal8z2rPSSAxUoGQYAHZlRLGEYACICCAEQEBoCd3M&ae=2&co=1&ase=2&gclid=CjwKCAiA2PrMBhA4EiwAwpHyCyTYypFr6AsJOlWoYvWcV7AlzfuA2ad-5WqAVSubmsEP-_ZzTVXRMRoCnTIQAvD_BwE&cce=2&category=acrcp_v1_71&sig=AOD64_2MJAd4FNF-2Le9cOWevXwPRXVb3A&ctype=5&q=&nis=4&ved=2ahUKEwjuh8T2rPSSAxUPNvsDHQETB5EQ9aACKAB6BAgdEGU&adurl=';

const EXPECTED_ORI_PROPORTION = 0.5;

const resultsDir = path.join(__dirname, '..', 'results');

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Détermine la variante A/B à partir des paramètres de l'URL finale.
 *  - "ori"  : URL contient dataiads_variation=…-ori et lpo=ori
 *  - "lpo"  : URL contient lpoid mais PAS dataiads_variation
 *  - "unknown" : aucun marqueur reconnu
 */
function detectVariant(finalUrl: string): 'ori' | 'lpo' | 'unknown' {
  try {
    const url = new URL(finalUrl);
    const variation = url.searchParams.get('dataiads_variation');
    const lpo = url.searchParams.get('lpo');
    const lpoid = url.searchParams.get('lpoid');

    if (variation && variation.endsWith('-ori') && lpo === 'ori') {
      return 'ori';
    }
    if (lpoid && !variation) {
      return 'lpo';
    }
    // Fallback : si au moins lpoid est présent avec variation → ori
    if (lpoid && variation) {
      return 'ori';
    }
  } catch {
    // URL invalide
  }
  return 'unknown';
}

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

        // Déterminer la variante via les paramètres de l'URL finale
        const finalUrl = page.url();
        const variant = detectVariant(finalUrl);

        // Gérer la bannière de consentement
        const consentButton = page.locator('#onetrust-accept-btn-handler')
          .or(page.locator('[data-testid="consent-accept"]'))
          .or(page.locator('button:has-text("Aceptar")'));

        const consentTimeout = throttle === '3g' ? 20000 : 10000;
        try {
          await consentButton.waitFor({ timeout: consentTimeout });
          await consentButton.click();
        } catch {
          // Bannière de consentement non trouvée, on continue
        }

        // Attendre les hits analytics asynchrones
        const waitTime = throttle === '3g' ? 10000 : 5000;
        await page.waitForTimeout(waitTime);

        // Extraire eVar157 en parcourant TOUS les hits et TOUS les events
        const allHits = statsHelper.getHits();
        const allEvar157 = statsHelper.findAllEvar157();
        const evar157 = statsHelper.findEvar157();

        const loadTime = Date.now() - startTime;

        const passed = variant !== 'unknown';
        const result: IterationResult = {
          iteration: i,
          passed,
          loadTime,
          browser: browserName,
          variant,
          finalUrl,
          evar157,
        };
        reporter.addResult(result);

        expect.soft(variant, `Variante indéterminée pour URL: ${finalUrl}`).not.toBe('unknown');

        const evarDisplay = allEvar157.length > 1
          ? `${evar157} (${allEvar157.length} valeurs: ${allEvar157.join(' | ')})`
          : (evar157 || 'N/A');

        console.log(
          `#${String(i).padStart(3, '0')}: variant=${variant} | evar157=${evarDisplay} | ` +
          `hits=${allHits.length} | ${loadTime}ms`
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
    const stats = abReporter.analyze(results, EXPECTED_ORI_PROPORTION);
    abReporter.printReport(stats);

    // Verdict final si suffisamment de données
    if (stats.oriCount + stats.lpoCount >= 30) {
      if (stats.isSignificant) {
        console.log(
          `⚠ ATTENTION: Le split dévie significativement du ratio attendu ` +
          `${EXPECTED_ORI_PROPORTION * 100}/${(1 - EXPECTED_ORI_PROPORTION) * 100}. ` +
          `Vérifiez la configuration de l'A/B test.`
        );
      } else {
        console.log(
          `✓ PASS: Le split est cohérent avec le ratio attendu ` +
          `${EXPECTED_ORI_PROPORTION * 100}/${(1 - EXPECTED_ORI_PROPORTION) * 100}.`
        );
      }
    }
  });
});
