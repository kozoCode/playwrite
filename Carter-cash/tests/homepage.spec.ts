import { test, expect } from '@playwright/test';
import { AdobeHelper } from './utils/adobe';
import { validateHomepageADL, validateHomepageHit, validateAdobeRequestExists } from './utils/assertions';

test('Homepage - Adobe Analytics hit validation', async ({ page }) => {
  const adobe = new AdobeHelper(page);
  adobe.setupInterception();

  await page.goto('/', { waitUntil: 'networkidle' });
  await adobe.waitForADL();

  // Vérifier l'événement page_load dans ADL
  const eventNames = await adobe.getEventNames();
  console.log('Événements adl:', eventNames);

  const pageLoadIndex = eventNames.indexOf('page_load');
  expect.soft(pageLoadIndex, 'page_load event should exist').toBeGreaterThanOrEqual(0);

  // Valider la structure ADL
  const pageLoadEvent = await adobe.getPageLoadEvent();
  validateHomepageADL(pageLoadEvent);

  // Valider les requêtes Adobe
  validateAdobeRequestExists(adobe.getRequests());

  // Valider les eVars et props
  const requestWithDimensions = adobe.getRequestWithDimensions();
  expect.soft(requestWithDimensions, 'At least one Adobe request should contain customDimensions').toBeDefined();

  if (requestWithDimensions) {
    const dimensions = adobe.extractDimensions(requestWithDimensions);
    validateHomepageHit(dimensions);
  }
});
