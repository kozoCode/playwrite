import * as fs from 'fs';
import * as path from 'path';

export interface IterationResult {
  iteration: number;
  passed: boolean;
  aid: string | undefined;
  loadTime: number;
  hitUrl?: string;
  browser?: string;
  variant?: 'lp' | 'www' | 'unknown';
  finalUrl?: string;
  evar157?: string;
}

export interface TestResults {
  testName: string;
  totalIterations: number;
  passedIterations: number;
  failedIterations: number;
  results: IterationResult[];
}

export class ResultsReporter {
  private results: IterationResult[] = [];
  private testName: string;

  constructor(testName: string) {
    this.testName = testName;
  }

  addResult(result: IterationResult): void {
    this.results.push(result);
  }

  getResults(): TestResults {
    const passedIterations = this.results.filter(r => r.passed).length;
    return {
      testName: this.testName,
      totalIterations: this.results.length,
      passedIterations,
      failedIterations: this.results.length - passedIterations,
      results: this.results
    };
  }

  printConsoleReport(): void {
    const stats = this.getResults();

    console.log('\n================================================================================');
    console.log(`RESULTATS - ${stats.testName} (${stats.totalIterations} itérations)`);
    console.log('================================================================================');
    console.log(`Tests passants (AID présent): ${stats.passedIterations}/${stats.totalIterations}`);
    console.log(`Tests échoués (AID absent): ${stats.failedIterations}/${stats.totalIterations}`);
    console.log('\n--- DETAIL PAR ITERATION ---');

    for (const result of stats.results) {
      const status = result.passed ? 'PASS' : 'FAIL';
      const aidDisplay = result.aid || 'undefined';
      const browserDisplay = result.browser ? ` | browser=${result.browser}` : '';
      console.log(`#${String(result.iteration).padStart(2, '0')}: ${status} | aid=${aidDisplay} | loadTime=${result.loadTime}ms${browserDisplay}`);
    }

    console.log('================================================================================\n');
  }

  exportToJSON(resultsDir: string): string {
    const stats = this.getResults();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `norauto-es-aid-${timestamp}.json`;
    const filepath = path.join(resultsDir, filename);

    fs.mkdirSync(resultsDir, { recursive: true });
    fs.writeFileSync(filepath, JSON.stringify(stats, null, 2));

    console.log(`JSON exporté: ${filepath}`);
    return filepath;
  }

  exportToCSV(resultsDir: string): string {
    const stats = this.getResults();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `norauto-es-aid-${timestamp}.csv`;
    const filepath = path.join(resultsDir, filename);

    const header = 'iteration,passed,aid,loadTime,browser,variant,finalUrl,evar157';
    const rows = stats.results.map(r =>
      `${r.iteration},${r.passed},${r.aid || ''},${r.loadTime},${r.browser || ''},${r.variant || ''},${r.finalUrl || ''},${r.evar157 || ''}`
    );
    const csvContent = [header, ...rows].join('\n');

    fs.mkdirSync(resultsDir, { recursive: true });
    fs.writeFileSync(filepath, csvContent);

    console.log(`CSV exporté: ${filepath}`);
    return filepath;
  }
}
