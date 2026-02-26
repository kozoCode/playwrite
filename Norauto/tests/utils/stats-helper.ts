import { Page } from '@playwright/test';

export interface StatsHit {
  url: string;
  timestamp: number;
  body: any;
}

export class StatsHelper {
  private hits: StatsHit[] = [];

  // Patterns d'endpoints analytics Adobe (Edge + collect classique)
  private static readonly PATTERNS = [
    /sstats\.norauto\.es\/ee\/irl1\/v1\/interact/,
    /norauto\.es\/ee\/.*\/v1\/interact/,
    /edge\.adobedc\.net/,
    /norauto\.sc\.omtrdc\.net/,
  ];

  constructor() {
    this.hits = [];
  }

  setupInterception(page: Page): void {
    page.on('request', (request) => {
      const url = request.url();
      const isAnalytics = StatsHelper.PATTERNS.some(p => p.test(url));
      if (isAnalytics && request.method() === 'POST') {
        try {
          const hit: StatsHit = {
            url,
            timestamp: Date.now(),
            body: JSON.parse(request.postData() || '{}'),
          };
          this.hits.push(hit);
        } catch {
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

  /**
   * Parcourt TOUS les events de TOUS les hits pour extraire l'AID RtbHouse.
   */
  extractAid(hit: StatsHit | undefined): string | undefined {
    if (!hit) return undefined;
    try {
      const events = hit.body?.events || [];
      for (const event of events) {
        const aid = event?.xdm?._norauto?.BrowserInformation?.Providers?.RtbHouse?.aid;
        if (aid) return aid;
      }
    } catch {
      // ignore
    }
    return undefined;
  }

  validateAid(hit: StatsHit | undefined): boolean {
    const aid = this.extractAid(hit);
    return aid !== undefined && aid !== null && aid !== '';
  }

  /**
   * Parcourt TOUS les events d'un hit pour extraire eVar157.
   */
  extractEvar157FromHit(hit: StatsHit | undefined): string | undefined {
    if (!hit) return undefined;
    try {
      const events = hit.body?.events || [];
      for (const event of events) {
        const val = event?.xdm?._experience?.analytics?.customDimensions?.eVars?.eVar157;
        if (val) return val;
      }
    } catch {
      // ignore
    }
    return undefined;
  }

  /**
   * Alias rétro-compatible : cherche eVar157 dans un hit donné.
   */
  extractEvar157(hit: StatsHit | undefined): string | undefined {
    return this.extractEvar157FromHit(hit);
  }

  /**
   * Collecte TOUTES les valeurs distinctes d'eVar157 à travers tous les hits/events.
   */
  findAllEvar157(): string[] {
    const values = new Set<string>();
    for (const hit of this.hits) {
      try {
        const events = hit.body?.events || [];
        for (const event of events) {
          const val = event?.xdm?._experience?.analytics?.customDimensions?.eVars?.eVar157;
          if (val) values.add(val);
        }
      } catch {
        // ignore
      }
    }
    return [...values];
  }

  /**
   * Parcourt TOUS les hits et TOUS les events pour trouver eVar157.
   * Si plusieurs valeurs distinctes sont trouvées, log un warning et retourne la dernière.
   */
  findEvar157(): string | undefined {
    const all = this.findAllEvar157();
    if (all.length === 0) return undefined;
    if (all.length > 1) {
      console.warn(`[StatsHelper] ${all.length} valeurs distinctes d'eVar157 trouvées: ${all.join(' | ')}`);
    }
    return all[all.length - 1];
  }

  /**
   * Collecte TOUTES les valeurs distinctes d'AID à travers tous les hits/events.
   */
  findAllAids(): string[] {
    const values = new Set<string>();
    for (const hit of this.hits) {
      try {
        const events = hit.body?.events || [];
        for (const event of events) {
          const aid = event?.xdm?._norauto?.BrowserInformation?.Providers?.RtbHouse?.aid;
          if (aid) values.add(aid);
        }
      } catch {
        // ignore
      }
    }
    return [...values];
  }

  /**
   * Parcourt TOUS les hits et TOUS les events pour trouver l'AID.
   * Si plusieurs valeurs distinctes sont trouvées, log un warning et retourne la dernière.
   */
  findAid(): string | undefined {
    const all = this.findAllAids();
    if (all.length === 0) return undefined;
    if (all.length > 1) {
      console.warn(`[StatsHelper] ${all.length} AIDs distincts trouvés: ${all.join(' | ')}`);
    }
    return all[all.length - 1];
  }

  extractCustomDimensions(hit: StatsHit | undefined): { eVars?: Record<string, string>; props?: Record<string, string> } {
    try {
      const events = hit?.body?.events || [];
      for (const event of events) {
        const dims = event?.xdm?._experience?.analytics?.customDimensions;
        if (dims) return { eVars: dims?.eVars, props: dims?.props };
      }
    } catch {
      // ignore
    }
    return { eVars: undefined, props: undefined };
  }

  getHitWithDimensions(): StatsHit | undefined {
    return this.hits.find((hit) => {
      const events = hit.body?.events || [];
      return events.some(
        (event: any) => event?.xdm?._experience?.analytics?.customDimensions
      );
    });
  }

  clearHits(): void {
    this.hits = [];
  }
}
