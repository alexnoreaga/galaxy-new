import { json } from '@shopify/remix-oxygen';

const FIRESTORE_KEY = 'AIzaSyAfREwK-3UbL1x7jeeR6L3McIsAROvZ5hU';
const FIRESTORE_BASE = 'https://firestore.googleapis.com/v1/projects/galaxypwa/databases/(default)/documents';

export async function action({ request }) {
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, { status: 405 });

  try {
    const formData = await request.formData();
    const productHandle = String(formData.get('productHandle') || '').trim();
    const productTitle = String(formData.get('productTitle') || '').trim();
    const customerName = String(formData.get('customerName') || '').trim();
    const rating = parseInt(formData.get('rating') || '5');
    const reviewText = String(formData.get('reviewText') || '').trim();
    const orderNumber = String(formData.get('orderNumber') || '').trim();
    const verifiedPurchase = formData.get('verifiedPurchase') === 'true';
    const source = String(formData.get('source') || 'online').trim(); // 'online' | 'toko'
    const photoUrl = String(formData.get('photoUrl') || '').trim();

    if (!productHandle || !customerName || !reviewText || rating < 1 || rating > 5) {
      return json({ error: 'Data tidak lengkap' }, { status: 400 });
    }

    if (reviewText.length < 10) {
      return json({ error: 'Review terlalu singkat' }, { status: 400 });
    }

    const docId = `${productHandle}_${Date.now()}`;
    const createdAt = new Date().toISOString();

    const firestoreDoc = {
      fields: {
        productHandle: { stringValue: productHandle },
        productTitle: { stringValue: productTitle },
        customerName: { stringValue: customerName },
        rating: { integerValue: String(rating) },
        reviewText: { stringValue: reviewText },
        orderNumber: { stringValue: orderNumber },
        verifiedPurchase: { booleanValue: verifiedPurchase },
        source: { stringValue: source },
        photoUrl: { stringValue: photoUrl },
        status: { stringValue: 'pending' },
        createdAt: { stringValue: createdAt },
      },
    };

    const res = await fetch(
      `${FIRESTORE_BASE}/reviews/${docId}?key=${FIRESTORE_KEY}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(firestoreDoc),
      }
    );

    if (!res.ok) {
      const errText = await res.text();
      console.error('Firestore error:', errText);
      return json({ error: 'Gagal menyimpan review: ' + errText }, { status: 500 });
    }

    return json({ success: true });
  } catch (error) {
    console.error('Submit review error:', error);
    return json({ error: 'Terjadi kesalahan' }, { status: 500 });
  }
}
