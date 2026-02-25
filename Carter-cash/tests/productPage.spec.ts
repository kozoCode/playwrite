import { test, expect } from '@playwright/test';
import { AdobeHelper } from './utils/adobe';
import {
  validateProductPageADL,
  validateProductPageHit,
  validateProductPageProducts,
  validateAdobeRequestExists,
} from './utils/assertions';

const productTestData = [
  { name: 'Pneus', url: '/pneus/p/145-70-r13-71T-AP1950H1-APL05' },
  { name: 'Accessoires', url: '/accessoires/p/housse-noire-unitaire-28868538' },
  { name: 'Pièces auto', url: '/pieces-auto/p/10w40-areca-5l-s3000-21013591/1000000092' },
];

productTestData.forEach(({ name, url }) => {
  test(`ProductPage - ${name}`, async ({ page }) => {
    const adobe = new AdobeHelper(page);
    adobe.setupInterception();

    await page.goto(url, { waitUntil: 'networkidle' });
    await adobe.waitForADL();

    // Vérifier les événements
    const eventNames = await adobe.getEventNames();
    console.log('Événements adl:', eventNames);

    const productPageViewIndex = eventNames.indexOf('productPageView');
    const pageLoadIndex = eventNames.indexOf('page_load');

    expect.soft(productPageViewIndex, 'productPageView event should exist').toBeGreaterThanOrEqual(0);
    expect.soft(pageLoadIndex, 'page_load event should exist').toBeGreaterThanOrEqual(0);

    // Valider la structure ADL
    const pageLoadEvent = await adobe.getPageLoadEvent();
    validateProductPageADL(pageLoadEvent);

    console.log(`Requêtes Adobe capturées: ${adobe.getRequestCount()}`);

    // Valider les requêtes Adobe
    validateAdobeRequestExists(adobe.getRequests());

    // Valider les productListItems
    const requestWithProducts = adobe.getRequestWithProducts();
    expect.soft(requestWithProducts, 'At least one Adobe request should contain productListItems').toBeDefined();

    if (requestWithProducts) {
      const products = adobe.extractProducts(requestWithProducts);
      validateProductPageProducts(products);

      // Valider les eVars et props
      const dimensions = adobe.extractDimensions(requestWithProducts);
      validateProductPageHit(dimensions);
    }
  });
});
