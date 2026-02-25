import { Page } from '@playwright/test';

// ============================================================================
// INTERFACES
// ============================================================================

export interface AdobeRequest {
  url: string;
  body: AdobeRequestBody;
  parseError?: string;
}

export interface AdobeRequestBody {
  events: Array<{
    xdm: {
      productListItems?: AdobeProduct[];
      _experience?: {
        analytics?: {
          customDimensions?: {
            eVars?: Record<string, string>;
            props?: Record<string, string>;
          };
        };
      };
    };
  }>;
}

export interface AdobeProduct {
  SKU: string;
  name: string;
  priceTotal: number;
  currencyCode: string;
  _experience?: {
    analytics?: {
      customDimensions?: {
        eVars?: Record<string, string>;
      };
    };
  };
}

export interface ADLEvent {
  event: string;
  env?: {
    language?: string;
    channel?: string;
    country?: string;
    currency?: string;
    template?: string;
    template_detail?: string;
    work?: string;
  };
  page?: {
    url?: string;
    name?: string;
    cat1?: string;
    cat2?: string;
    cat3?: string;
  };
  customer?: {
    logged?: string;
  };
  saved?: {
    store?: string;
  };
  store?: {
    id?: string;
  };
  store_name?: string;
  nb_products?: number;
  product_id_list?: string[];
  brand?: string;
  availability?: string;
  product_id?: string;
  code8?: string;
}

export interface CustomDimensions {
  eVars?: Record<string, string>;
  props?: Record<string, string>;
}

// ============================================================================
// ADDTOCART INTERFACES
// ============================================================================

export interface AddToCartProduct {
  product_name: string | null;
  product_id: string | null;
  product_code8: string;
  product_discount_ati: number;
  product_discount_tf: number;
  product_unitprice_ati: number;
  product_unitprice_tf: number | null;
  product_brand: string;
  product_category: string;
  product_variant: string;
  product_quantity: number;
  product_rating: string;
  product_service: boolean;
  product_attachment: any[];
}

export interface AddToCartEvent {
  event: 'addToCart';
  add_product: AddToCartProduct[];
}

export interface AddToCartAdobeProduct {
  SKU: string;
  name: string;
  priceTotal: number;
  currencyCode: string;
  discountAmount?: number;
  quantity?: number;
  _experience?: {
    analytics?: {
      customDimensions?: {
        eVars?: Record<string, string>;
        event1to100?: {
          event3?: { value: number };
        };
      };
    };
  };
}

// ============================================================================
// ADOBE HELPER CLASS
// ============================================================================

export class AdobeHelper {
  private adobeRequests: AdobeRequest[] = [];
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Configure l'interception des requêtes Adobe
   * IMPORTANT: Appeler AVANT la navigation
   */
  setupInterception(): void {
    this.page.on('request', (request) => {
      if (!request.url().includes('edge.adobedc.net')) return;

      const postData = request.postData();
      if (!postData) return;

      try {
        this.adobeRequests.push({
          url: request.url(),
          body: JSON.parse(postData),
        });
      } catch (error) {
        console.error(`Failed to parse Adobe request: ${error}`);
        this.adobeRequests.push({
          url: request.url(),
          body: { events: [] } as AdobeRequestBody,
          parseError: error instanceof Error ? error.message : String(error),
        });
      }
    });
  }

  /**
   * Attendre que l'objet ADL soit disponible
   */
  async waitForADL(timeout = 10000): Promise<void> {
    await this.page.waitForFunction(
      () => {
        const adl = (window as any).adl;
        return adl && adl[0] !== undefined;
      },
      { timeout }
    );
  }

  /**
   * Récupérer l'historique des événements ADL
   */
  async getADLHistory(): Promise<ADLEvent[]> {
    return await this.page.evaluate(() => {
      const adl = (window as any).adl;
      if (!adl) return [];

      const events: any[] = [];
      let i = 0;
      while (adl[i] !== undefined) {
        events.push(adl[i]);
        i++;
      }
      return events;
    });
  }

  /**
   * Récupérer les noms des événements ADL
   */
  async getEventNames(): Promise<string[]> {
    const history = await this.getADLHistory();
    return history.map((e) => e?.event).filter(Boolean);
  }

  /**
   * Trouver un événement spécifique dans l'historique ADL
   */
  async findEvent(eventName: string): Promise<ADLEvent | undefined> {
    const history = await this.getADLHistory();
    return history.find((e) => e?.event === eventName);
  }

  /**
   * Récupérer l'événement page_load
   */
  async getPageLoadEvent(): Promise<ADLEvent | undefined> {
    return this.findEvent('page_load');
  }

  /**
   * Récupérer toutes les requêtes Adobe capturées
   */
  getRequests(): AdobeRequest[] {
    return this.adobeRequests;
  }

  /**
   * Trouver la requête contenant les customDimensions
   */
  getRequestWithDimensions(): AdobeRequest | undefined {
    return this.adobeRequests.find(
      (req) => req.body?.events?.[0]?.xdm?._experience?.analytics?.customDimensions
    );
  }

  /**
   * Trouver la requête contenant des productListItems
   */
  getRequestWithProducts(): AdobeRequest | undefined {
    return this.adobeRequests.find(
      (req) => req.body?.events?.[0]?.xdm?.productListItems?.length > 0
    );
  }

  /**
   * Extraire les eVars et props d'une requête
   */
  extractDimensions(request?: AdobeRequest): CustomDimensions {
    if (!request) return { eVars: undefined, props: undefined };

    const customDimensions = request.body?.events?.[0]?.xdm?._experience?.analytics?.customDimensions;
    return {
      eVars: customDimensions?.eVars,
      props: customDimensions?.props,
    };
  }

  /**
   * Extraire les productListItems d'une requête
   */
  extractProducts(request?: AdobeRequest): AdobeProduct[] {
    if (!request) return [];
    return request.body?.events?.[0]?.xdm?.productListItems || [];
  }

  /**
   * Réinitialiser les requêtes capturées
   */
  clear(): void {
    this.adobeRequests = [];
  }

  /**
   * Vérifier si au moins une requête Adobe a été capturée
   */
  hasRequests(): boolean {
    return this.adobeRequests.length > 0;
  }

  /**
   * Obtenir le nombre de requêtes capturées
   */
  getRequestCount(): number {
    return this.adobeRequests.length;
  }

  /**
   * Attendre un événement spécifique dans ADL
   */
  async waitForEvent(eventName: string, timeout = 10000): Promise<void> {
    await this.page.waitForFunction(
      (name) => {
        const adl = (window as any).adl;
        if (!adl) return false;

        let i = 0;
        while (adl[i] !== undefined) {
          if (adl[i]?.event === name) return true;
          i++;
        }
        return false;
      },
      eventName,
      { timeout }
    );
  }

  /**
   * Récupérer l'événement addToCart
   */
  async getAddToCartEvent(): Promise<AddToCartEvent | undefined> {
    const history = await this.getADLHistory();
    return history.find((e) => e?.event === 'addToCart') as AddToCartEvent | undefined;
  }

  /**
   * Récupérer la dernière requête Adobe capturée
   */
  getLastRequest(): AdobeRequest | undefined {
    if (this.adobeRequests.length === 0) return undefined;
    return this.adobeRequests[this.adobeRequests.length - 1];
  }
}
