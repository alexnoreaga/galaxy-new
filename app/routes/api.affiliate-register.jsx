import { json } from '@shopify/remix-oxygen';

const FIRESTORE_KEY = 'AIzaSyAfREwK-3UbL1x7jeeR6L3McIsAROvZ5hU';
const FIRESTORE_BASE = 'https://firestore.googleapis.com/v1/projects/galaxypwa/databases/(default)/documents';

const CUSTOMER_QUERY = `#graphql
  query GetCustomer($token: String!) {
    customer(customerAccessToken: $token) { email firstName lastName }
  }
`;

function generateRefCode(email) {
  const base = email.split('@')[0].replace(/[^a-z0-9]/gi, '').toUpperCase().slice(0, 6);
  const suffix = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `${base}${suffix}`;
}

async function getAffiliateByEmail(email) {
  const res = await fetch(`${FIRESTORE_BASE}:runQuery?key=${FIRESTORE_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      structuredQuery: {
        from: [{ collectionId: 'affiliates' }],
        where: { fieldFilter: { field: { fieldPath: 'email' }, op: 'EQUAL', value: { stringValue: email } } },
        limit: 1,
      },
    }),
  });
  const rows = await res.json();
  const doc = rows?.[0]?.document;
  if (!doc) return null;
  const f = doc.fields || {};
  return {
    refCode: f.refCode?.stringValue || '',
    name: f.name?.stringValue || '',
    namaBank: f.namaBank?.stringValue || '',
    nomorRekening: f.nomorRekening?.stringValue || '',
    atasNama: f.atasNama?.stringValue || '',
    promoMethod: f.promoMethod?.stringValue || '',
    status: f.status?.stringValue || 'pending',
    totalClicks: parseInt(f.totalClicks?.integerValue || 0),
    totalOrders: parseInt(f.totalOrders?.integerValue || 0),
    totalEarned: parseInt(f.totalEarned?.integerValue || 0),
    totalPaid: parseInt(f.totalPaid?.integerValue || 0),
    createdAt: f.createdAt?.stringValue || '',
  };
}

// GET: get affiliate profile for logged-in user
export async function loader({ context }) {
  const { session, storefront } = context;
  const customerAccessToken = await session.get('customerAccessToken');
  if (!customerAccessToken?.accessToken) return json({ affiliate: null });

  const { customer } = await storefront.query(CUSTOMER_QUERY, {
    variables: { token: customerAccessToken.accessToken },
    cache: storefront.CacheNone(),
  }).catch(() => ({ customer: null }));

  if (!customer) return json({ affiliate: null });

  const affiliate = await getAffiliateByEmail(customer.email);
  return json({ affiliate });
}

// POST: register new affiliate
export async function action({ request, context }) {
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, { status: 405 });

  const { session, storefront } = context;
  const customerAccessToken = await session.get('customerAccessToken');
  if (!customerAccessToken?.accessToken) {
    return json({ error: 'Harus login terlebih dahulu' }, { status: 401 });
  }

  const { customer } = await storefront.query(CUSTOMER_QUERY, {
    variables: { token: customerAccessToken.accessToken },
    cache: storefront.CacheNone(),
  }).catch(() => ({ customer: null }));

  if (!customer) return json({ error: 'Customer tidak ditemukan' }, { status: 404 });

  const formData = await request.formData();
  const name = String(formData.get('name') || '').trim();
  const namaBank = String(formData.get('namaBank') || '').trim();
  const nomorRekening = String(formData.get('nomorRekening') || '').trim();
  const atasNama = String(formData.get('atasNama') || '').trim();
  const promoMethod = String(formData.get('promoMethod') || '').trim();

  if (!name || !namaBank || !nomorRekening || !atasNama) {
    return json({ error: 'Nama dan info rekening wajib diisi lengkap' }, { status: 400 });
  }

  // Check if already registered
  const existing = await getAffiliateByEmail(customer.email);
  if (existing) {
    return json({ error: 'Email ini sudah terdaftar sebagai affiliate' }, { status: 400 });
  }

  // Generate unique refCode
  let refCode = generateRefCode(customer.email);
  const checkDoc = await fetch(`${FIRESTORE_BASE}/affiliates/${refCode}?key=${FIRESTORE_KEY}`);
  if (checkDoc.ok) {
    const checkData = await checkDoc.json().catch(() => ({}));
    if (!checkData.error) {
      refCode = generateRefCode(customer.email) + Date.now().toString(36).slice(-2).toUpperCase();
    }
  }

  const saveRes = await fetch(`${FIRESTORE_BASE}/affiliates/${refCode}?key=${FIRESTORE_KEY}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fields: {
        email: { stringValue: customer.email },
        name: { stringValue: name },
        namaBank: { stringValue: namaBank },
        nomorRekening: { stringValue: nomorRekening },
        atasNama: { stringValue: atasNama },
        promoMethod: { stringValue: promoMethod },
        refCode: { stringValue: refCode },
        status: { stringValue: 'pending' },
        totalClicks: { integerValue: '0' },
        totalOrders: { integerValue: '0' },
        totalEarned: { integerValue: '0' },
        totalPaid: { integerValue: '0' },
        createdAt: { stringValue: new Date().toISOString() },
      },
    }),
  });

  if (!saveRes.ok) return json({ error: 'Gagal menyimpan data, coba lagi' }, { status: 500 });

  return json({ ok: true, refCode });
}
