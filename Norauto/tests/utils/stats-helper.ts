import { Page } from '@playwright/test';

export interface StatsHit {
  url: string;
  timestamp: number;
  body: any;
}

export class StatsHelper {
  private hits: StatsHit[] = [];
  private static readonly STATS_PATTERN = /sstats\.norauto\.es\/ee\/irl1\/v1\/interact/;

  constructor() {
    this.hits = [];
  }

  setupInterception(page: Page): void {
    page.on('request', (request) => {
      if (StatsHelper.STATS_PATTERN.test(request.url()) && request.method() === 'POST') {
        try {
          const hit: StatsHit = {
            url: request.url(),
            timestamp: Date.now(),
            body: JSON.parse(request.postData() || '{}')
          };
          this.hits.push(hit);
        } catch (e) {
          // Ignore parsing errors
        }
      }
    });
  }

  getHits(): StatsHit[] {
    return this.hits;
  }

  getLastHit(): StatsHit | undefined {
    return this.hits[this.hits.length - 1];
  }

  extractAid(hit: StatsHit | undefined): string | undefined {
    try {
      const aid = hit?.body?.events?.[0]?.xdm?._norauto?.BrowserInformation?.Providers?.RtbHouse?.aid;
      return aid;
    } catch {
      return undefined;
    }
  }

  validateAid(hit: StatsHit | undefined): boolean {
    const aid = this.extractAid(hit);
    return aid !== undefined && aid !== null && aid !== '';
  }

  extractEvar157(hit: StatsHit | undefined): string | undefined {
    try {
      return hit?.body?.events?.[0]?.xdm?._experience?.analytics?.customDimensions?.eVars?.eVar157;
    } catch {
      return undefined;
    }
  }

  extractCustomDimensions(hit: StatsHit | undefined): { eVars?: Record<string, string>; props?: Record<string, string> } {
    try {
      const dims = hit?.body?.events?.[0]?.xdm?._experience?.analytics?.customDimensions;
      return { eVars: dims?.eVars, props: dims?.props };
    } catch {
      return { eVars: undefined, props: undefined };
    }
  }

  getHitWithDimensions(): StatsHit | undefined {
    return this.hits.find(
      (hit) => hit.body?.events?.[0]?.xdm?._experience?.analytics?.customDimensions
    );
  }

  clearHits(): void {
    this.hits = [];
  }
}
