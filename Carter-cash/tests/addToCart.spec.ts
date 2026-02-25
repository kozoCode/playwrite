import { test, expect } from '@playwright/test';
import { AdobeHelper, AddToCartProduct } from './utils/adobe';
import { validateAddToCartADL, validateAddToCartHit } from './utils/assertions';

const productTestData = [
  { name: 'Pneus', url: '/pneus/p/145-70-r13-71T-AP1950H1-APL05' },
  { name: 'Accessoires', url: '/accessoires/p/housse-noire-unitaire-28868538' },
  { name: 'Pièces auto', url: '/pieces-auto/p/10w40-areca-5l-s3000-21013591/1000000092' },
];

productTestData.forEach(({ name, url }) => {
  test(`AddToCart - ${name}`, async ({ page }) => {
    const adobe = new AdobeHelper(page);
    adobe.setupInterception();

    // 1. Aller sur la page produit
    await page.goto(url);
    await adobe.waitForADL();

    // 2. Accepter le consentement (si visible)
    const consentButton = page.locator('#popin_tc_privacy_button_3');
    if (await consentButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await consentButton.click();
      await page.waitForTimeout(500);
    }

    // 3. Réinitialiser les requêtes pour capturer uniquement addToCart
    adobe.clear();

    // 4. Cliquer sur Ajouter au panier
    const addToCartButton = page.locator('#add_to_cart_add');
    await addToCartButton.click();

    // 5. Attendre l'événement addToCart dans ADL
    await adobe.waitForEvent('addToCart');

    // 6. Valider l'événement ADL
    const addToCartEvent = await adobe.getAddToCartEvent();
    validateAddToCartADL(addToCartEvent);

    // 7. Extraire le produit principal (non-service) pour la validation de cohérence
    let mainProduct: AddToCartProduct | undefined;
    if (addToCartEvent?.add_product) {
      mainProduct = addToCartEvent.add_product.find((p) => p.product_service === false);
    }

    // 8. Attendre la requête Adobe (jusqu'à 5 secondes)
    let attempts = 0;
    while (!adobe.hasRequests() && attempts < 10) {
      await page.waitForTimeout(500);
      attempts++;
    }

    console.log(`Requêtes Adobe capturées après addToCart: ${adobe.getRequestCount()}`);

    // 9. Valider le hit Adobe avec cohérence ADL
    const lastRequest = adobe.getLastRequest();
    expect.soft(lastRequest, 'Adobe request should be sent after addToCart').toBeDefined();

    if (lastRequest) {
      const products = adobe.extractProducts(lastRequest);
      validateAddToCartHit(products as any, mainProduct);
    }
  });
});
