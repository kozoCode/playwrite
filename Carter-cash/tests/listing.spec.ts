import { test, expect } from '@playwright/test';
import { AdobeHelper } from './utils/adobe';
import {
  validateCategoryPageADL,
  validateCategoryPageHit,
  validateCategoryPageProducts,
  validateAdobeRequestExists,
  validateEventOrder,
} from './utils/assertions';

const listingTestData = [
  { name: 'Pièces auto', url: '/pieces-auto/c/huiles-lubrifiants/huile-moteur' },
  { name: 'Pneus', url: '/pneus/aplus' },
  { name: 'Accessoires', url: '/accessoires/interieur/housses' },
];

listingTestData.forEach(({ name, url }) => {
  test(`CategoryPage - ${name}`, async ({ page }) => {
    const adobe = new AdobeHelper(page);
    adobe.setupInterception();

    await page.goto(url, { waitUntil: 'networkidle' });
    await adobe.waitForADL();

    // Vérifier l'ordre des événements (listingPushed DOIT venir avant page_load)
    const eventNames = await adobe.getEventNames();
    validateEventOrder(eventNames, 'listingPushed', 'page_load');

    // Valider la structure ADL
    const pageLoadEvent = await adobe.getPageLoadEvent();
    validateCategoryPageADL(pageLoadEvent);

    console.log(`Requêtes Adobe capturées: ${adobe.getRequestCount()}`);

    // Valider les requêtes Adobe
    validateAdobeRequestExists(adobe.getRequests());

    // Valider les productListItems
    const requestWithProducts = adobe.getRequestWithProducts();
    expect.soft(requestWithProducts, 'At least one Adobe request should contain productListItems').toBeDefined();

    if (requestWithProducts) {
      const products = adobe.extractProducts(requestWithProducts);
      validateCategoryPageProducts(products);

      // Valider les eVars et props
      const dimensions = adobe.extractDimensions(requestWithProducts);
      validateCategoryPageHit(dimensions);
    }
  });
});
