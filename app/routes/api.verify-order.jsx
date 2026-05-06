import { json } from '@shopify/remix-oxygen';

const FIRESTORE_KEY = 'AIzaSyAfREwK-3UbL1x7jeeR6L3McIsAROvZ5hU';

export async function action({ request, context }) {
  if (request.method !== 'POST') return json({ verified: false });

  const formData = await request.formData();
  const orderNumber = String(formData.get('orderNumber') || '').trim().replace(/^#/, '');

  if (!orderNumber) return json({ verified: false });

  try {
    const adminToken = context.env?.PUBLIC_STOREFRONT_API_TOKEN || process.env.PUBLIC_STOREFRONT_API_TOKEN;
    const storeDomain = context.env?.PUBLIC_STORE_DOMAIN || process.env.PUBLIC_STORE_DOMAIN;

    const res = await fetch(
      `https://${storeDomain}/admin/api/2024-01/orders.json?name=%23${orderNumber}&status=any&fields=id,name,email`,
      { headers: { 'X-Shopify-Access-Token': adminToken } }
    );

    if (!res.ok) return json({ verified: false });

    const data = await res.json();
    const found = (data.orders || []).length > 0;
    return json({ verified: found });
  } catch (_) {
    return json({ verified: false });
  }
}
