// Catalog index: every brand (vendor) × category (productType) in the store with product counts.
// Powers the marketplace-style "find" pages (/brands/<brand>/<category>): the sitemap lists every
// combination with enough products, /brands lists every brand, and product pages link up to their
// own brand × category page. Built from a full Storefront walk (250 per page, ~19 pages for
// 4,600 products) and cached per worker instance for 6 h — only the sitemap and the brand index
// use it, never a customer page's critical path.
export const MIN_PRODUCTS = 3; // same threshold as the brand page's noindex rule

// "Tripod/Monopod" → "tripod-monopod" (must stay identical to slugType in brands.$handle.$)
export const slugType = (s) => String(s || '').toLowerCase().replace(/&/g, 'dan').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
// "OM SYSTEM" → "om-system" (the /brands/<handle> convention used by links and the sitemap)
export const brandHandle = (v) => String(v || '').toLowerCase().trim().replace(/\s+/g, '-');

const CATALOG_QUERY = `#graphql
  query CatalogIndex($after: String) {
    products(first: 250, after: $after) {
      pageInfo { hasNextPage endCursor }
      nodes {
        vendor productType availableForSale handle title
        featuredImage { url }
        priceRange { minVariantPrice { amount } }
        unitDemo: metafield(namespace: "custom", key: "unit_demo") { value }
      }
    }
  }
`;

const TTL_MS = 6 * 60 * 60 * 1000;
let cache = { at: 0, data: null, inflight: null };

// Pure aggregation over product nodes ({vendor, productType, availableForSale}) — the sitemap feeds
// it the nodes of its own product walk so no second walk is needed there.
export function buildCatalogIndex(nodes) {
  const brands = new Map(); // handle → {name, handle, count, ready, categories: Map(slug → {...})}
  const demoUnits = []; // products with a demo unit in a branch (custom.unit_demo = list of branch names)
  let total = 0;
  for (const p of nodes ?? []) {
    total++;
    if (p?.unitDemo?.value && p.handle) {
      let stores = [];
      try { const v = JSON.parse(p.unitDemo.value); stores = (Array.isArray(v) ? v : [v]).map((x) => String(x).trim().toLowerCase()).filter(Boolean); } catch { stores = [String(p.unitDemo.value).toLowerCase()]; }
      if (stores.length) demoUnits.push({ handle: p.handle, title: p.title, image: p.featuredImage?.url || '', price: Number(p.priceRange?.minVariantPrice?.amount) || 0, available: !!p.availableForSale, stores: stores.map((x) => (/^semua/.test(x) ? 'semua' : x)) });
    }
    const bh = brandHandle(p?.vendor);
    if (!bh) continue;
    let b = brands.get(bh);
    if (!b) { b = { name: p.vendor.trim(), handle: bh, count: 0, ready: 0, categories: new Map() }; brands.set(bh, b); }
    b.count++; if (p.availableForSale) b.ready++;
    const cs = slugType(p.productType);
    if (!cs) continue;
    let c = b.categories.get(cs);
    if (!c) { c = { name: p.productType.trim(), slug: cs, count: 0, ready: 0 }; b.categories.set(cs, c); }
    c.count++; if (p.availableForSale) c.ready++;
  }
  const list = [...brands.values()]
    .map((b) => ({ ...b, categories: [...b.categories.values()].sort((x, y) => y.count - x.count) }))
    .sort((x, y) => y.count - x.count);
  return { brands: list, demoUnits, total, fetchedAt: new Date().toISOString() };
}

export async function getCatalogIndex(storefront, { maxPages = 30 } = {}) {
  if (cache.data && Date.now() - cache.at < TTL_MS) return cache.data;
  if (cache.inflight) return cache.inflight;
  cache.inflight = (async () => {
    const nodes = [];
    let after = null;
    for (let page = 0; page < maxPages; page++) {
      const data = await storefront.query(CATALOG_QUERY, { variables: { after } });
      const conn = data?.products;
      nodes.push(...(conn?.nodes ?? []));
      if (!conn?.pageInfo?.hasNextPage) break;
      after = conn.pageInfo.endCursor;
    }
    const data = buildCatalogIndex(nodes);
    cache = { at: Date.now(), data, inflight: null };
    return data;
  })().catch((e) => { cache.inflight = null; throw e; });
  return cache.inflight;
}
