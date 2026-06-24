import {json} from '@shopify/remix-oxygen';

const FIRESTORE_BASE = 'https://firestore.googleapis.com/v1/projects/galaxypwa/databases/(default)/documents';
const KEY = 'AIzaSyAfREwK-3UbL1x7jeeR6L3McIsAROvZ5hU';

function parseItems(doc) {
  return (doc.fields?.items?.arrayValue?.values || [])
    .map((v) => {
      const f = v.mapValue?.fields || {};
      return {
        handle: f.handle?.stringValue || '',
        title: f.title?.stringValue || '',
        image: f.image?.stringValue || '',
        price: f.price?.stringValue || '',
        addedAt: f.addedAt?.stringValue || '',
      };
    })
    .filter((i) => i.handle);
}

function toFirestoreArray(items) {
  return {
    arrayValue: {
      values: items.map((item) => ({
        mapValue: {
          fields: {
            handle: {stringValue: item.handle},
            title: {stringValue: item.title || ''},
            image: {stringValue: item.image || ''},
            price: {stringValue: item.price || ''},
            addedAt: {stringValue: item.addedAt || new Date().toISOString()},
          },
        },
      })),
    },
  };
}

async function getItems(email) {
  const res = await fetch(
    `${FIRESTORE_BASE}/wishlists/${encodeURIComponent(email)}?key=${KEY}`,
  );
  if (!res.ok) return [];
  const doc = await res.json();
  return parseItems(doc);
}

async function saveItems(email, items) {
  await fetch(
    `${FIRESTORE_BASE}/wishlists/${encodeURIComponent(email)}?key=${KEY}`,
    {
      method: 'PATCH',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({fields: {items: toFirestoreArray(items)}}),
    },
  );
}

// GET /api/wishlist?email=...
export async function loader({request}) {
  const url = new URL(request.url);
  const email = url.searchParams.get('email');
  if (!email) return json({items: []});
  const items = await getItems(email);
  return json({items});
}

// POST /api/wishlist  body: {action, email, item?, items?}
export async function action({request}) {
  const body = await request.json();
  const {action: act, email, item, items} = body;
  if (!email) return json({ok: false});

  if (act === 'add') {
    const current = await getItems(email);
    if (!current.some((i) => i.handle === item.handle)) {
      await saveItems(email, [...current, item]);
    }
  } else if (act === 'remove') {
    const current = await getItems(email);
    await saveItems(
      email,
      current.filter((i) => i.handle !== item.handle),
    );
  } else if (act === 'merge') {
    // merge localStorage items into Firestore (no duplicates)
    const current = await getItems(email);
    const merged = [...current];
    for (const newItem of items || []) {
      if (!merged.some((i) => i.handle === newItem.handle)) {
        merged.push(newItem);
      }
    }
    await saveItems(email, merged);
  }

  return json({ok: true});
}
