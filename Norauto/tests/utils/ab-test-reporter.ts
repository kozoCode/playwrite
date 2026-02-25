import { IterationResult } from './results-reporter';

export interface ABTestStats {
  totalIterations: number;
  lpCount: number;
  wwwCount: number;
  unknownCount: number;
  lpPercentage: number;
  wwwPercentage: number;
  expectedSplit: number;
  chiSquareStatistic: number;
  pValue: number;
  isSignificant: boolean;
  confidenceInterval: { lower: number; upper: number };
  evar157Distribution: Record<string, number>;
  evar157CaptureRate: number;
}

export class ABTestReporter {

  analyze(results: IterationResult[], expectedSplit: number = 0.5): ABTestStats {
    const lpCount = results.filter(r => r.variant === 'lp').length;
    const wwwCount = results.filter(r => r.variant === 'www').length;
    const unknownCount = results.filter(r => r.variant === 'unknown' || !r.variant).length;
    const validCount = lpCount + wwwCount;

    const lpPercentage = validCount > 0 ? lpCount / validCount : 0;
    const wwwPercentage = validCount > 0 ? wwwCount / validCount : 0;

    const chiSquare = this.chiSquareTest(lpCount, wwwCount, expectedSplit);
    const pValue = this.chiSquarePValue(chiSquare);

    const ci = this.wilsonConfidenceInterval(lpCount, validCount);

    const evar157Dist: Record<string, number> = {};
    let evar157Present = 0;
    for (const r of results) {
      if (r.evar157) {
        evar157Present++;
        evar157Dist[r.evar157] = (evar157Dist[r.evar157] || 0) + 1;
      }
    }

    return {
      totalIterations: results.length,
      lpCount,
      wwwCount,
      unknownCount,
      lpPercentage,
      wwwPercentage,
      expectedSplit,
      chiSquareStatistic: chiSquare,
      pValue,
      isSignificant: pValue < 0.05,
      confidenceInterval: ci,
      evar157Distribution: evar157Dist,
      evar157CaptureRate: results.length > 0 ? evar157Present / results.length : 0,
    };
  }

  private chiSquareTest(observedA: number, observedB: number, expectedProportion: number): number {
    const total = observedA + observedB;
    if (total === 0) return 0;

    const expectedA = total * expectedProportion;
    const expectedB = total * (1 - expectedProportion);

    return Math.pow(observedA - expectedA, 2) / expectedA
         + Math.pow(observedB - expectedB, 2) / expectedB;
  }

  /**
   * P-value approchée pour chi-carré avec 1 degré de liberté.
   * Utilise la relation : P(χ² > x) = 2 * (1 - Φ(√x))
   */
  private chiSquarePValue(chiSquare: number): number {
    const z = Math.sqrt(chiSquare);
    return 2 * (1 - this.normalCDF(z));
  }

  /**
   * CDF normale standard (approximation d'Abramowitz & Stegun).
   */
  private normalCDF(x: number): number {
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;

    const sign = x < 0 ? -1 : 1;
    const absX = Math.abs(x) / Math.sqrt(2);

    const t = 1.0 / (1.0 + p * absX);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-absX * absX);

    return 0.5 * (1.0 + sign * y);
  }

  /**
   * Intervalle de confiance Wilson à 95% pour une proportion binomiale.
   */
  private wilsonConfidenceInterval(successes: number, total: number): { lower: number; upper: number } {
    if (total === 0) return { lower: 0, upper: 1 };

    const z = 1.96;
    const pHat = successes / total;

    const denominator = 1 + z * z / total;
    const center = (pHat + z * z / (2 * total)) / denominator;
    const margin = (z / denominator) * Math.sqrt(pHat * (1 - pHat) / total + z * z / (4 * total * total));

    return {
      lower: Math.max(0, center - margin),
      upper: Math.min(1, center + margin),
    };
  }

  printReport(stats: ABTestStats): void {
    console.log('\n================================================================================');
    console.log('RAPPORT A/B TEST - VERIFICATION DU SPLIT');
    console.log('================================================================================');
    console.log(`Itérations totales: ${stats.totalIterations}`);
    console.log(`  lp.norauto.es:  ${stats.lpCount} (${(stats.lpPercentage * 100).toFixed(1)}%)`);
    console.log(`  www.norauto.es: ${stats.wwwCount} (${(stats.wwwPercentage * 100).toFixed(1)}%)`);
    console.log(`  Indéterminé:    ${stats.unknownCount}`);
    console.log('');
    console.log('--- ANALYSE STATISTIQUE ---');
    console.log(`Split attendu: ${(stats.expectedSplit * 100).toFixed(0)}/${((1 - stats.expectedSplit) * 100).toFixed(0)}`);
    console.log(`Statistique chi-carré: ${stats.chiSquareStatistic.toFixed(4)}`);
    console.log(`P-value: ${stats.pValue.toFixed(4)}`);
    console.log(`Déviation significative: ${stats.isSignificant ? 'OUI ⚠' : 'NON ✓'}`);
    console.log(`IC 95% proportion LP: [${(stats.confidenceInterval.lower * 100).toFixed(1)}%, ${(stats.confidenceInterval.upper * 100).toFixed(1)}%]`);
    console.log('');
    console.log('--- ANALYSE eVar157 ---');
    console.log(`Taux de capture: ${(stats.evar157CaptureRate * 100).toFixed(1)}%`);
    console.log('Distribution:');
    for (const [value, count] of Object.entries(stats.evar157Distribution)) {
      console.log(`  "${value}": ${count} occurrences`);
    }
    if (Object.keys(stats.evar157Distribution).length === 0) {
      console.log('  (aucune valeur capturée)');
    }
    console.log('================================================================================\n');
  }
}
