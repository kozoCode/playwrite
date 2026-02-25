import { expect } from '@playwright/test';
import { ADLEvent, AdobeProduct, AdobeRequest, CustomDimensions, AddToCartEvent, AddToCartAdobeProduct } from './adobe';

// ============================================================================
// HOMEPAGE ASSERTIONS
// ============================================================================

export function validateHomepageADL(event: ADLEvent | undefined): void {
  expect.soft(event, 'page_load event should exist').toBeDefined();
  if (!event) return;

  console.log('ADL page_load:', event);

  // Vérifier env
  expect.soft(event.env, 'ADL page_load should have env').toBeDefined();
  expect.soft(event.env?.language, 'ADL env.language should be fr').toBe('fr');
  expect.soft(event.env?.channel, 'ADL env.channel should be web').toBe('web');
  expect.soft(event.env?.country, 'ADL env.country should be Carter-Cash France').toBe('Carter-Cash France');
  expect.soft(event.env?.currency, 'ADL env.currency should be EUR').toBe('EUR');
  expect.soft(event.env?.template, 'ADL env.template should be Homepage').toBe('Homepage');
  expect.soft(event.env?.template_detail, 'ADL env.template_detail should be empty').toBe('');
  expect.soft(event.env?.work, 'ADL env.work should be prod').toBe('prod');

  // Vérifier page
  expect.soft(event.page, 'ADL page_load should have page').toBeDefined();
  expect.soft(event.page?.url, 'ADL page.url should exist').toBeDefined();
  expect.soft(event.page?.name, 'ADL page.name should be /').toBe('/');
  expect.soft(event.page?.cat1, 'ADL page.cat1 should be Homepage').toBe('Homepage');

  // Vérifier customer
  expect.soft(event.customer, 'ADL page_load should have customer').toBeDefined();
  expect.soft(event.customer?.logged, 'ADL customer.logged should be unlogged').toBe('unlogged');

  // Vérifier saved
  expect.soft(event.saved, 'ADL page_load should have saved').toBeDefined();
  expect.soft(event.saved?.store, 'ADL saved.store should be Non').toBe('Non');

  // Vérifier store
  expect.soft(event.store, 'ADL page_load should have store').toBeDefined();
  expect.soft(event.store?.id, 'ADL store.id should be empty').toBe('');

  // Vérifier store_name
  expect.soft(event.store_name, 'ADL store_name should be empty').toBe('');
}

export function validateHomepageHit(dimensions: CustomDimensions): void {
  const { eVars, props } = dimensions;

  console.log('eVars:', eVars);
  console.log('props:', props);

  // Vérifier les eVars
  expect.soft(eVars, 'Request should have eVars').toBeDefined();
  expect.soft(eVars?.eVar1, 'eVar1 (country code) should be FR').toBe('FR');
  expect.soft(eVars?.eVar2, 'eVar2 (language) should be fr').toBe('fr');
  expect.soft(eVars?.eVar3, 'eVar3 (page type) should be Homepage').toBe('Homepage');
  expect.soft(eVars?.eVar4, 'eVar4 (domain) should exist').toBeDefined();
  expect.soft(eVars?.eVar11, 'eVar11 (logged status) should exist').toBeDefined();
  expect.soft(eVars?.eVar20, 'eVar20 should be Homepage').toBe('Homepage');
  expect.soft(eVars?.eVar24, 'eVar24 (page path) should be /').toBe('/');
  expect.soft(eVars?.eVar25, 'eVar25 (page URL) should exist').toBeDefined();
  expect.soft(eVars?.eVar28, 'eVar28 should exist (can be empty)').toBeDefined();
  expect.soft(eVars?.eVar36, 'eVar36 should exist').toBeDefined();
  expect.soft(eVars?.eVar48, 'eVar48 (timestamp) should exist').toBeDefined();
  expect.soft(eVars?.eVar49, 'eVar49 (visitor ID) should exist').toBeDefined();
  expect.soft(eVars?.eVar50, 'eVar50 should exist').toBeDefined();

  // Vérifier les props
  expect.soft(props, 'Request should have props').toBeDefined();
  expect.soft(props?.prop1, 'prop1 (country code) should be FR').toBe('FR');
  expect.soft(props?.prop2, 'prop2 (language) should be fr').toBe('fr');
  expect.soft(props?.prop3, 'prop3 (page type) should be Homepage').toBe('Homepage');
  expect.soft(props?.prop4, 'prop4 (domain) should exist').toBeDefined();
  expect.soft(props?.prop6, 'prop6 (event name) should be page_load').toBe('page_load');
  expect.soft(props?.prop11, 'prop11 (logged status) should exist').toBeDefined();
  expect.soft(props?.prop20, 'prop20 should be Homepage').toBe('Homepage');
  expect.soft(props?.prop24, 'prop24 (page path) should be /').toBe('/');
  expect.soft(props?.prop25, 'prop25 (page URL) should exist').toBeDefined();
  expect.soft(props?.prop26, 'prop26 should exist').toBeDefined();
  expect.soft(props?.prop28, 'prop28 should exist (can be empty)').toBeDefined();
  expect.soft(props?.prop31, 'prop31 should exist (can be empty)').toBeDefined();
  expect.soft(props?.prop36, 'prop36 should exist').toBeDefined();
  expect.soft(props?.prop48, 'prop48 (timestamp) should exist').toBeDefined();
  expect.soft(props?.prop49, 'prop49 (visitor ID) should exist').toBeDefined();
  expect.soft(props?.prop52, 'prop52 should exist').toBeDefined();
}

// ============================================================================
// CATEGORY PAGE (LISTING) ASSERTIONS
// ============================================================================

export function validateCategoryPageADL(event: ADLEvent | undefined): void {
  expect.soft(event, 'page_load event should exist').toBeDefined();
  if (!event) return;

  console.log('ADL page_load:', event);

  // Vérifier env
  expect.soft(event.env, 'ADL page_load should have env').toBeDefined();
  expect.soft(event.env?.language, 'ADL env.language should exist').toBeDefined();
  expect.soft(event.env?.channel, 'ADL env.channel should exist').toBeDefined();
  expect.soft(event.env?.country, 'ADL env.country should exist').toBeDefined();
  expect.soft(event.env?.currency, 'ADL env.currency should be EUR').toBe('EUR');
  expect.soft(event.env?.template, 'ADL env.template should be CategoryPage').toBe('CategoryPage');
  expect.soft(event.env?.template_detail, 'ADL env.template_detail should be CategoryPage').toBe('CategoryPage');
  expect.soft(event.env?.work, 'ADL env.work should exist').toBeDefined();

  // Vérifier page
  expect.soft(event.page, 'ADL page_load should have page').toBeDefined();
  expect.soft(event.page?.url, 'ADL page.url should exist').toBeDefined();
  expect.soft(event.page?.name, 'ADL page.name should exist').toBeDefined();
  expect.soft(event.page?.cat1, 'ADL page.cat1 should exist').toBeDefined();
  expect.soft(event.page?.cat2, 'ADL page.cat2 should exist').toBeDefined();

  // Vérifier customer
  expect.soft(event.customer, 'ADL page_load should have customer').toBeDefined();
  expect.soft(event.customer?.logged, 'ADL customer.logged should exist').toBeDefined();

  // Vérifier données listing
  expect.soft(event.nb_products, 'ADL nb_products should exist').toBeDefined();
  expect.soft(event.product_id_list, 'ADL product_id_list should exist').toBeDefined();
}

export function validateCategoryPageHit(dimensions: CustomDimensions): void {
  const { eVars, props } = dimensions;

  console.log('eVars:', eVars);
  console.log('props:', props);

  // Vérifier les eVars obligatoires
  expect.soft(eVars, 'Request should have eVars').toBeDefined();
  expect.soft(eVars?.eVar1, 'eVar1 (country code) should exist').toBeDefined();
  expect.soft(eVars?.eVar2, 'eVar2 (language) should exist').toBeDefined();
  expect.soft(eVars?.eVar3, 'eVar3 (page type) should be CategoryPage').toBe('CategoryPage');
  expect.soft(eVars?.eVar4, 'eVar4 (domain) should exist').toBeDefined();
  expect.soft(eVars?.eVar11, 'eVar11 (logged status) should exist').toBeDefined();
  expect.soft(eVars?.eVar20, 'eVar20 (category L1) should exist').toBeDefined();
  expect.soft(eVars?.eVar24, 'eVar24 (page path) should exist').toBeDefined();
  expect.soft(eVars?.eVar25, 'eVar25 (page URL) should exist').toBeDefined();

  // Vérifier les props obligatoires
  expect.soft(props, 'Request should have props').toBeDefined();
  expect.soft(props?.prop1, 'prop1 (country code) should exist').toBeDefined();
  expect.soft(props?.prop2, 'prop2 (language) should exist').toBeDefined();
  expect.soft(props?.prop3, 'prop3 (page type) should be CategoryPage').toBe('CategoryPage');
  expect.soft(props?.prop4, 'prop4 (domain) should exist').toBeDefined();
  expect.soft(props?.prop6, 'prop6 (event name) should exist').toBeDefined();
  expect.soft(props?.prop11, 'prop11 (logged status) should exist').toBeDefined();
  expect.soft(props?.prop20, 'prop20 (category L1) should exist').toBeDefined();
  expect.soft(props?.prop24, 'prop24 (page path) should exist').toBeDefined();
  expect.soft(props?.prop25, 'prop25 (page URL) should exist').toBeDefined();
}

export function validateCategoryPageProducts(products: AdobeProduct[]): void {
  expect.soft(products.length, 'productListItems should have items').toBeGreaterThan(0);

  if (products.length === 0) return;

  console.log('Nombre de produits:', products.length);

  const firstProduct = products[0];
  expect.soft(firstProduct.SKU, 'First product should have SKU').toBeDefined();
  expect.soft(firstProduct.name, 'First product should have name').toBeDefined();
  expect.soft(firstProduct.priceTotal, 'First product should have priceTotal').toBeDefined();
  expect.soft(firstProduct.currencyCode, 'First product should have currencyCode EUR').toBe('EUR');
  expect.soft(firstProduct._experience?.analytics?.customDimensions?.eVars, 'First product should have eVars').toBeDefined();
}

// ============================================================================
// PRODUCT PAGE ASSERTIONS
// ============================================================================

export function validateProductPageADL(event: ADLEvent | undefined): void {
  expect.soft(event, 'page_load event should exist').toBeDefined();
  if (!event) return;

  console.log('ADL page_load:', event);

  // Vérifier env
  expect.soft(event.env, 'ADL page_load should have env').toBeDefined();
  expect.soft(event.env?.language, 'ADL env.language should exist').toBeDefined();
  expect.soft(event.env?.channel, 'ADL env.channel should exist').toBeDefined();
  expect.soft(event.env?.country, 'ADL env.country should exist').toBeDefined();
  expect.soft(event.env?.currency, 'ADL env.currency should be EUR').toBe('EUR');
  expect.soft(event.env?.template, 'ADL env.template should be ProductPage').toBe('ProductPage');
  expect.soft(event.env?.template_detail, 'ADL env.template_detail should exist').toBeDefined();
  expect.soft(event.env?.work, 'ADL env.work should exist').toBeDefined();

  // Vérifier page
  expect.soft(event.page, 'ADL page_load should have page').toBeDefined();
  expect.soft(event.page?.url, 'ADL page.url should exist').toBeDefined();
  expect.soft(event.page?.name, 'ADL page.name should exist').toBeDefined();
  expect.soft(event.page?.cat1, 'ADL page.cat1 should exist').toBeDefined();
  expect.soft(event.page?.cat2, 'ADL page.cat2 should exist').toBeDefined();
  expect.soft(event.page?.cat3, 'ADL page.cat3 should exist').toBeDefined();

  // Vérifier customer
  expect.soft(event.customer, 'ADL page_load should have customer').toBeDefined();
  expect.soft(event.customer?.logged, 'ADL customer.logged should exist').toBeDefined();

  // Vérifier données produit
  expect.soft(event.brand, 'ADL brand should exist').toBeDefined();
  expect.soft(event.availability, 'ADL availability should exist').toBeDefined();
  expect.soft(event.product_id, 'ADL product_id should exist').toBeDefined();
  expect.soft(event.code8, 'ADL code8 should exist').toBeDefined();
}

export function validateProductPageHit(dimensions: CustomDimensions): void {
  const { eVars, props } = dimensions;

  console.log('eVars:', eVars);
  console.log('props:', props);

  // Vérifier les eVars obligatoires pour une ProductPage
  expect.soft(eVars, 'Request should have eVars').toBeDefined();
  expect.soft(eVars?.eVar1, 'eVar1 (country code) should exist').toBeDefined();
  expect.soft(eVars?.eVar2, 'eVar2 (language) should exist').toBeDefined();
  expect.soft(eVars?.eVar3, 'eVar3 (page type) should be ProductPage').toBe('ProductPage');
  expect.soft(eVars?.eVar4, 'eVar4 (domain) should exist').toBeDefined();
  expect.soft(eVars?.eVar11, 'eVar11 (logged status) should exist').toBeDefined();
  expect.soft(eVars?.eVar20, 'eVar20 (category L1) should exist').toBeDefined();
  expect.soft(eVars?.eVar21, 'eVar21 (brand) should exist').toBeDefined();
  expect.soft(eVars?.eVar22, 'eVar22 (product name) should exist').toBeDefined();
  expect.soft(eVars?.eVar24, 'eVar24 (page path) should exist').toBeDefined();
  expect.soft(eVars?.eVar25, 'eVar25 (page URL) should exist').toBeDefined();

  // Vérifier les props obligatoires pour une ProductPage
  expect.soft(props, 'Request should have props').toBeDefined();
  expect.soft(props?.prop1, 'prop1 (country code) should exist').toBeDefined();
  expect.soft(props?.prop2, 'prop2 (language) should exist').toBeDefined();
  expect.soft(props?.prop3, 'prop3 (page type) should be ProductPage').toBe('ProductPage');
  expect.soft(props?.prop4, 'prop4 (domain) should exist').toBeDefined();
  expect.soft(props?.prop6, 'prop6 (event name) should exist').toBeDefined();
  expect.soft(props?.prop11, 'prop11 (logged status) should exist').toBeDefined();
  expect.soft(props?.prop20, 'prop20 (category L1) should exist').toBeDefined();
  expect.soft(props?.prop21, 'prop21 (brand) should exist').toBeDefined();
  expect.soft(props?.prop22, 'prop22 (product name) should exist').toBeDefined();
  expect.soft(props?.prop24, 'prop24 (page path) should exist').toBeDefined();
  expect.soft(props?.prop25, 'prop25 (page URL) should exist').toBeDefined();
}

export function validateProductPageProducts(products: AdobeProduct[]): void {
  expect.soft(products.length, 'productListItems should have items').toBeGreaterThan(0);

  if (products.length === 0) return;

  console.log('Nombre de produits:', products.length);

  const firstProduct = products[0];
  expect.soft(firstProduct.SKU, 'Product should have SKU').toBeDefined();
  expect.soft(firstProduct.name, 'Product should have name').toBeDefined();
  expect.soft(firstProduct.priceTotal, 'Product should have priceTotal').toBeDefined();
  expect.soft(firstProduct.currencyCode, 'Product should have currencyCode EUR').toBe('EUR');
  expect.soft(firstProduct._experience?.analytics?.customDimensions?.eVars, 'Product should have eVars').toBeDefined();
}

// ============================================================================
// GENERIC ASSERTIONS
// ============================================================================

export function validateAdobeRequestExists(requests: { length: number }): void {
  console.log('Requêtes Adobe:', requests.length);
  expect.soft(requests.length, 'At least one Adobe request should be sent').toBeGreaterThan(0);
}

export function validateEventOrder(eventNames: string[], firstEvent: string, secondEvent: string): void {
  console.log('Événements adl:', eventNames);

  const firstIndex = eventNames.indexOf(firstEvent);
  const secondIndex = eventNames.indexOf(secondEvent);

  expect.soft(firstIndex, `${firstEvent} event should exist`).toBeGreaterThanOrEqual(0);
  expect.soft(secondIndex, `${secondEvent} event should exist`).toBeGreaterThanOrEqual(0);

  expect.soft(
    secondIndex,
    `${secondEvent} (index ${secondIndex}) should come after ${firstEvent} (index ${firstIndex})`
  ).toBeGreaterThan(firstIndex);
}

// ============================================================================
// ADDTOCART ASSERTIONS
// ============================================================================

export function validateAddToCartADL(event: AddToCartEvent | undefined): void {
  expect.soft(event, 'addToCart event should exist').toBeDefined();
  if (!event) return;

  console.log('ADL addToCart:', event);

  // Vérifier add_product
  expect.soft(event.add_product, 'addToCart should have add_product').toBeDefined();
  expect.soft(event.add_product?.length, 'add_product should have items').toBeGreaterThan(0);

  if (!event.add_product || event.add_product.length === 0) return;

  // Trouver le premier produit non-service
  const mainProduct = event.add_product.find((p) => p.product_service === false);

  if (mainProduct) {
    console.log('Main product:', mainProduct);

    expect.soft(mainProduct.product_name, 'product_name should exist').toBeDefined();
    expect.soft(mainProduct.product_code8, 'product_code8 should exist').toBeDefined();
    expect.soft(
      mainProduct.product_code8?.startsWith('F'),
      'product_code8 should not start with F (service product)'
    ).toBe(false);
    expect.soft(mainProduct.product_unitprice_ati, 'product_unitprice_ati should be > 0').toBeGreaterThan(0);
    expect.soft(mainProduct.product_quantity, 'product_quantity should be >= 1').toBeGreaterThanOrEqual(1);
    expect.soft(mainProduct.product_category, 'product_category should exist').toBeDefined();
    expect.soft(mainProduct.product_service, 'product_service should be false').toBe(false);
  }
}

export function validateAddToCartHit(products: AddToCartAdobeProduct[], adlProduct?: AddToCartProduct): void {
  console.log('Adobe productListItems:', products);

  expect.soft(products.length, 'productListItems should have items').toBeGreaterThan(0);

  if (products.length === 0) return;

  const firstProduct = products[0];
  console.log('First product:', firstProduct);

  // Vérifier les champs de base
  expect.soft(firstProduct.SKU, 'SKU should exist').toBeDefined();
  expect.soft(firstProduct.currencyCode, 'currencyCode should be EUR').toBe('EUR');
  expect.soft(firstProduct.name, 'name should exist').toBeDefined();
  expect.soft(firstProduct.priceTotal, 'priceTotal should be > 0').toBeGreaterThan(0);
  expect.soft(firstProduct.quantity, 'quantity should be >= 1').toBeGreaterThanOrEqual(1);

  // Vérifier les eVars spécifiques à addToCart
  const eVars = firstProduct._experience?.analytics?.customDimensions?.eVars;
  expect.soft(eVars, 'Product should have eVars').toBeDefined();

  if (eVars) {
    expect.soft(eVars.eVar8, 'eVar8 (fr + code) should exist').toBeDefined();
    expect.soft(eVars.eVar8, 'eVar8 should start with fr').toMatch(/^fr/);
    expect.soft(eVars.eVar32, 'eVar32 (product code) should exist').toBeDefined();
    expect.soft(eVars.eVar40, 'eVar40 (rating) should be defined').toBeDefined();
    expect.soft(eVars.eVar46, 'eVar46 (product name) should exist').toBeDefined();
    expect.soft(eVars.eVar47, 'eVar47 (category) should exist').toBeDefined();

    // Vérifier la cohérence avec les données ADL si fournies
    if (adlProduct) {
      console.log('Vérification cohérence ADL <-> Adobe hit:');
      console.log(`  eVar32 (${eVars.eVar32}) vs product_code8 (${adlProduct.product_code8})`);
      console.log(`  eVar46 (${eVars.eVar46}) vs product_name (${adlProduct.product_name})`);
      console.log(`  eVar47 (${eVars.eVar47}) vs product_category (${adlProduct.product_category})`);

      expect.soft(eVars.eVar32, 'eVar32 should match product_code8').toBe(adlProduct.product_code8);
      expect.soft(eVars.eVar46, 'eVar46 should match product_name').toBe(adlProduct.product_name);
      expect.soft(eVars.eVar47, 'eVar47 should match product_category').toBe(adlProduct.product_category);
    }
  }

  // Vérifier event3
  const events = firstProduct._experience?.analytics?.customDimensions?.event1to100;
  expect.soft(events?.event3, 'event3 should exist').toBeDefined();
  expect.soft(events?.event3?.value, 'event3.value should be >= 1').toBeGreaterThanOrEqual(1);

  // Vérifier que event3.value correspond à la quantité ADL
  if (adlProduct && events?.event3) {
    console.log(`  event3.value (${events.event3.value}) vs product_quantity (${adlProduct.product_quantity})`);
    expect.soft(events.event3.value, 'event3.value should match product_quantity').toBe(adlProduct.product_quantity);
  }
}
