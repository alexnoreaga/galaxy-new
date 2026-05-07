import { json } from '@shopify/remix-oxygen';

const FIRESTORE_KEY = 'AIzaSyAfREwK-3UbL1x7jeeR6L3McIsAROvZ5hU';
const SECRET = 'galaxy-backfill-2026';

// ── GET: show upload form ────────────────────────────────────────────────────
export async function loader({ request }) {
  const url = new URL(request.url);
  if (url.searchParams.get('secret') !== SECRET) {
    return new Response('Unauthorized', { status: 401 });
  }

  return new Response(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Backfill Sold Counts</title>
  <style>
    body { font-family: sans-serif; max-width: 600px; margin: 60px auto; padding: 0 20px; background: #f9f9f9; }
    h1 { font-size: 20px; margin-bottom: 8px; }
    p { color: #555; font-size: 14px; margin-bottom: 24px; }
    .drop { border: 2px dashed #ccc; border-radius: 12px; padding: 40px; text-align: center; cursor: pointer; background: #fff; transition: border-color .2s; }
    .drop:hover, .drop.over { border-color: #333; }
    input[type=file] { display: none; }
    button { margin-top: 20px; padding: 12px 28px; background: #111; color: #fff; border: none; border-radius: 8px; font-size: 15px; cursor: pointer; }
    button:disabled { opacity: .5; cursor: not-allowed; }
    #status { margin-top: 24px; font-size: 14px; }
    pre { background: #f0f0f0; padding: 16px; border-radius: 8px; overflow-x: auto; font-size: 12px; max-height: 400px; overflow-y: auto; }
  </style>
</head>
<body>
  <h1>Backfill Sold Counts</h1>
  <p>Export orders from Shopify Admin → Orders → Export (All orders, CSV), then upload below.</p>

  <div class="drop" id="drop" onclick="document.getElementById('file').click()">
    <div id="dropLabel">📁 Click or drag &amp; drop your Shopify orders CSV here</div>
    <input type="file" id="file" accept=".csv">
  </div>
  <button id="btn" disabled onclick="run()">Process CSV</button>
  <div id="status"></div>

  <script>
    const FIRESTORE_KEY = '${FIRESTORE_KEY}';
    const FIRESTORE_BASE = 'https://firestore.googleapis.com/v1/projects/galaxypwa/databases/(default)/documents';

    const drop = document.getElementById('drop');
    const fileInput = document.getElementById('file');
    const btn = document.getElementById('btn');
    const status = document.getElementById('status');
    let csvText = '';

    drop.addEventListener('dragover', e => { e.preventDefault(); drop.classList.add('over'); });
    drop.addEventListener('dragleave', () => drop.classList.remove('over'));
    drop.addEventListener('drop', e => {
      e.preventDefault(); drop.classList.remove('over');
      const f = e.dataTransfer.files[0];
      if (f) loadFile(f);
    });
    fileInput.addEventListener('change', () => { if (fileInput.files[0]) loadFile(fileInput.files[0]); });

    function loadFile(f) {
      const reader = new FileReader();
      reader.onload = e => {
        csvText = e.target.result;
        document.getElementById('dropLabel').textContent = '\\u2705 ' + f.name + ' loaded (' + (csvText.split('\\n').length - 1) + ' rows)';
        btn.disabled = false;
      };
      reader.readAsText(f);
    }

    async function run() {
      if (!csvText) return;
      btn.disabled = true;
      status.innerHTML = '<p>\\u23f3 Step 1/2: Computing sold counts (matching products)...</p>';

      const res = await fetch(location.href, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csv: csvText }),
      });

      const data = await res.json();
      if (data.error) {
        status.innerHTML = '<p style="color:red">Error: ' + data.error + '</p>';
        btn.disabled = false;
        return;
      }

      status.innerHTML = '<p>\\u23f3 Step 2/2: Writing ' + data.writes.length + ' products to Firestore (0/' + data.writes.length + ')...</p>';

      // Use individual PATCH requests in parallel batches of 20
      const now = new Date().toISOString();
      const BATCH = 20;
      let success = 0;
      let firstError = null;

      for (let i = 0; i < data.writes.length; i += BATCH) {
        const chunk = data.writes.slice(i, i + BATCH);
        await Promise.all(chunk.map(async ({ handle, qty }) => {
          const url = FIRESTORE_BASE + '/sold_counts/' + handle +
            '?key=' + FIRESTORE_KEY +
            '&updateMask.fieldPaths=count&updateMask.fieldPaths=updatedAt';
          const r = await fetch(url, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fields: {
                count: { integerValue: String(qty) },
                updatedAt: { stringValue: now },
              },
            }),
          });
          if (r.ok) {
            success++;
          } else if (!firstError) {
            firstError = { status: r.status, body: await r.text() };
          }
        }));
        status.innerHTML = '<p>\\u23f3 Writing to Firestore... ' + Math.min(i + BATCH, data.writes.length) + '/' + data.writes.length + '</p>';
      }

      if (firstError) {
        status.innerHTML =
          '<p style="color:red">\\u274c Firestore PATCH error ' + firstError.status + ': ' + firstError.body + '</p>' +
          '<p>' + success + '/' + data.writes.length + ' succeeded before first error</p>';
      } else {
        status.innerHTML =
          '<p>\\u2705 Done \\u2014 <strong>' + success + ' products</strong> written from <strong>' + data.orders + ' orders</strong></p>' +
          '<pre>' + JSON.stringify(data.totals.slice(0, 30), null, 2) + '</pre>';
      }
      btn.disabled = false;
    }
  </script>
</body>
</html>`, { headers: { 'Content-Type': 'text/html' } });
}

// ── POST: compute totals only (no Firestore write — browser does that) ───────
export async function action({ request, context }) {
  const url = new URL(request.url);
  if (url.searchParams.get('secret') !== SECRET) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { csv } = await request.json();
  if (!csv) return json({ error: 'No CSV data' }, { status: 400 });

  try {
    // ── Parse CSV ──────────────────────────────────────────────────────────
    const lines = csv.split(/\r?\n/);
    const headers = parseCSVLine(lines[0]).map(h => h.trim().toLowerCase());

    const nameIdx = headers.indexOf('lineitem name');
    const qtyIdx = headers.indexOf('lineitem quantity');

    if (nameIdx === -1 || qtyIdx === -1) {
      return json({ error: 'CSV missing "Lineitem name" or "Lineitem quantity" columns. Make sure you exported from Shopify Orders.' });
    }

    const nameTotals = {};
    const seenOrders = new Set();

    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      const cols = parseCSVLine(lines[i]);
      const rawName = (cols[nameIdx] || '').trim();
      const qty = parseInt(cols[qtyIdx] || '0');
      if (!rawName || !qty) continue;

      const orderNameIdx = headers.indexOf('name');
      if (orderNameIdx !== -1 && cols[orderNameIdx]) seenOrders.add(cols[orderNameIdx]);

      // Strip variant: "Sony ZV-E10 II - Black" → "Sony ZV-E10 II"
      const productName = rawName.includes(' - ') ? rawName.split(' - ').slice(0, -1).join(' - ') : rawName;
      nameTotals[productName] = (nameTotals[productName] || 0) + qty;
    }

    const orderCount = seenOrders.size;
    if (Object.keys(nameTotals).length === 0) return json({ error: 'No line items found in CSV.' });

    // ── Fetch all products from Storefront to build name→handle map ──────────
    const handleMap = {};
    let after = null;

    do {
      const { products } = await context.storefront.query(PRODUCTS_QUERY, {
        variables: { after },
      });
      for (const p of products?.nodes || []) {
        handleMap[p.title.toLowerCase()] = p.handle;
      }
      after = products?.pageInfo?.hasNextPage ? products.pageInfo.endCursor : null;
    } while (after);

    // ── Match product names → handles ────────────────────────────────────────
    function normalize(s) {
      return s.toLowerCase()
        .replace(/\bgaransi resmi\b/g, '')
        .replace(/\bresmi\b/g, '')
        .replace(/\boriginal\b/g, '')
        .replace(/\s+/g, ' ')
        .trim();
    }

    const normalizedHandleMap = {};
    for (const [title, handle] of Object.entries(handleMap)) {
      normalizedHandleMap[normalize(title)] = handle;
    }

    const handleTotals = {};
    for (const [name, qty] of Object.entries(nameTotals)) {
      let handle = handleMap[name.toLowerCase()];
      if (!handle) handle = normalizedHandleMap[normalize(name)];
      if (!handle) {
        const normName = normalize(name);
        for (const [normTitle, h] of Object.entries(normalizedHandleMap)) {
          if (normName.startsWith(normTitle) || normTitle.startsWith(normName)) {
            handle = h; break;
          }
        }
      }
      if (!handle) continue;
      handleTotals[handle] = (handleTotals[handle] || 0) + qty;
    }

    const writes = Object.entries(handleTotals)
      .map(([handle, qty]) => ({ handle, qty }))
      .sort((a, b) => b.qty - a.qty);

    return json({
      ok: true,
      orders: orderCount,
      writes,
      totals: writes,
    });

  } catch (err) {
    console.error('Backfill error:', err);
    return json({ error: String(err) }, { status: 500 });
  }
}

function parseCSVLine(line) {
  const result = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQuotes && line[i + 1] === '"') { cur += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (c === ',' && !inQuotes) {
      result.push(cur); cur = '';
    } else {
      cur += c;
    }
  }
  result.push(cur);
  return result;
}

const PRODUCTS_QUERY = `#graphql
  query BackfillProducts($after: String) {
    products(first: 250, after: $after) {
      pageInfo { hasNextPage endCursor }
      nodes { handle title }
    }
  }
`;
