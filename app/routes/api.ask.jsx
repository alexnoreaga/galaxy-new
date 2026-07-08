import { json } from '@shopify/remix-oxygen';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { storeKnowledge } from '~/lib/storeKnowledge';

const FIREBASE_PROJECT = 'galaxypwa';
const FIREBASE_API_KEY = 'AIzaSyAfREwK-3UbL1x7jeeR6L3McIsAROvZ5hU'; // read/write allowed via Firestore rules
const FIREBASE_BASE = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT}/databases/(default)/documents`;

// ── Firestore REST helpers ────────────────────────────────────────────────────

async function firestoreGet(collection, docId) {
  try {
    const res = await fetch(
      `${FIREBASE_BASE}/${collection}/${encodeURIComponent(docId)}?key=${FIREBASE_API_KEY}`
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data?.fields ?? null;
  } catch {
    return null;
  }
}

async function firestorePatch(collection, docId, fields) {
  try {
    // updateMask ensures only specified fields are updated — without it, PATCH replaces the entire document
    const mask = Object.keys(fields).map(k => `updateMask.fieldPaths=${encodeURIComponent(k)}`).join('&');
    await fetch(
      `${FIREBASE_BASE}/${collection}/${encodeURIComponent(docId)}?key=${FIREBASE_API_KEY}&${mask}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields }),
      }
    );
  } catch {
    // non-fatal — cache failure shouldn't break the response
  }
}

async function firestoreCreate(collection, fields) {
  try {
    const res = await fetch(
      `${FIREBASE_BASE}/${collection}?key=${FIREBASE_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields }),
      }
    );
    const data = await res.json();
    return data?.name?.split('/').pop() ?? null;
  } catch {
    return null;
  }
}

function fsString(val) { return { stringValue: String(val) } }
function fsArray(arr) { return { arrayValue: { values: arr.map(v => fsString(v)) } } }
function fsTimestamp() { return { timestampValue: new Date().toISOString() } }

function readFsArray(field) {
  return field?.arrayValue?.values?.map(v => v.stringValue) ?? [];
}

// ── Gemini helper ─────────────────────────────────────────────────────────────

function getGemini(context, { search = false, temperature } = {}) {
  const apiKey =
    context?.env?.GEMINI_API_KEY ??
    (typeof process !== 'undefined' ? process.env?.GEMINI_API_KEY : undefined);
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set in environment');
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    ...(search ? { tools: [{ googleSearch: {} }] } : {}),
    ...(temperature !== undefined ? { generationConfig: { temperature } } : {}),
  });
}

// ── GET — fetch (or generate) questions for a product ────────────────────────

export async function loader({ request, context }) {
  const url = new URL(request.url);
  const handle = url.searchParams.get('handle');
  if (!handle) return json({ error: 'Missing handle' }, { status: 400 });

  // 1. Check Firestore cache — skip if cached questions are empty (failed generation)
  const cached = await firestoreGet('product_questions', handle);
  const cachedQuestions = readFsArray(cached?.questions);
  if (cachedQuestions.length > 0) {
    return json({ questions: cachedQuestions, cached: true });
  }

  // 2. Generate with Gemini
  const title = url.searchParams.get('title') ?? handle;
  const description = url.searchParams.get('description') ?? '';

  const model = getGemini(context, { search: false });
  const prompt = `Kamu adalah asisten Galaxy Camera. Berdasarkan produk berikut, buat tepat 5 pertanyaan singkat (maks 7 kata) yang paling sering ditanyakan customer Indonesia di halaman produk ini. Return hanya JSON array of strings, tanpa penjelasan apapun.

Produk: ${title}
Deskripsi singkat: ${description.slice(0, 300)}

Contoh format: ["Apakah ada garansi resmi?","Bisa cicilan berapa bulan?","Apa yang termasuk dalam paket?","Cocok untuk pemula?","Ada stok warna lain?"]`;

  let questions = [];
  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    const match = text.match(/\[[\s\S]*\]/);
    if (match) questions = JSON.parse(match[0]);
  } catch (e) {
    console.error('[api.ask] question generation failed:', e?.message ?? e);
  }

  // 3. Save to Firestore only if questions were generated (don't cache empty results)
  if (questions.length > 0) {
    await firestorePatch('product_questions', handle, {
      questions: fsArray(questions),
      title: fsString(title),
      generated_at: fsTimestamp(),
    });
  }

  return json({ questions, cached: false });
}

// ── POST — answer a question or continue conversation ────────────────────────

const PRODUCT_SEARCH_QUERY = `#graphql
query askPredictiveSearch($searchTerm: String!) {
  predictiveSearch(limit: 5, limitScope: EACH, query: $searchTerm, types: [PRODUCT]) {
    products {
      title
      handle
      availableForSale
      featuredImage { url }
      priceRange { minVariantPrice { amount } }
    }
  }
}`;

// ── Rate limiting — max 15 messages per 5 minutes per session ────────────────
const RATE_WINDOW_MS = 5 * 60 * 1000;
const RATE_MAX = 15;
const rateMap = new Map();

function isRateLimited(sessionId) {
  if (!sessionId) return false;
  const now = Date.now();
  const recent = (rateMap.get(sessionId) ?? []).filter(t => now - t < RATE_WINDOW_MS);
  if (recent.length >= RATE_MAX) {
    rateMap.set(sessionId, recent);
    return true;
  }
  recent.push(now);
  rateMap.set(sessionId, recent);
  // Prevent unbounded memory growth
  if (rateMap.size > 500) {
    for (const [k, v] of rateMap) {
      if (v.every(t => now - t >= RATE_WINDOW_MS)) rateMap.delete(k);
    }
  }
  return false;
}

// ── Simple string hash for bubble answer cache keys ──────────────────────────
function simpleHash(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) >>> 0;
  return h.toString(36);
}

const VOUCHERS_QUERY = `#graphql
query askVouchers {
  metaobjects(type: "discount_voucher", first: 10) {
    edges { node { fields { key value } } }
  }
}`;

async function getActiveVouchers(context) {
  try {
    const data = await context.storefront.query(VOUCHERS_QUERY);
    const now = new Date();
    return (data?.metaobjects?.edges ?? [])
      .map(edge => {
        const f = Object.fromEntries((edge.node?.fields ?? []).map(x => [x.key, x.value]));
        return {
          code: f.code || '',
          discount: f.discount_value || '',
          discountType: f.discount_type || 'fixed',
          description: f.description || '',
          minPurchase: f.min_purchase || '',
          expiryDate: f.expiry_date || '',
        };
      })
      .filter(v => v.code)
      .filter(v => !v.expiryDate || new Date(v.expiryDate) >= now);
  } catch (e) {
    console.error('[api.ask] voucher fetch failed:', e?.message ?? e);
    return [];
  }
}

// Detect whether the customer is asking about other products, and search the store catalog
async function searchStoreProducts(context, question, messages, currentProduct = '') {
  try {
    const router = getGemini(context, { search: false, temperature: 0 });
    const recentHistory = messages.slice(-2).map(m => `${m.role === 'user' ? 'Customer' : 'Admin'}: ${m.text}`).join('\n');
    const routerPrompt = `Kamu adalah router pencarian untuk toko kamera online. Tugasmu HANYA menentukan apakah customer menanyakan KETERSEDIAAN, harga, atau rekomendasi suatu produk (kamera, lensa, drone, aksesoris, dll). Jika ya, output kata kunci pencarian produknya (2-5 kata). Jika tidak, output: NO

Jika customer menyebut "baterainya", "chargernya", "lensanya", "tasnya" dll yang merujuk ke produk yang sedang dilihat, gunakan pengetahuanmu tentang aksesoris yang kompatibel — sebutkan model spesifiknya (contoh: baterai Sony A6400 = NP-FW50, baterai Canon EOS RP = LP-E17).

PENTING: pertanyaan PERBANDINGAN atau opini ("bedanya apa", "bagusan mana", "vs", "lebih worth it mana", "mending mana") BUKAN pencarian produk → output NO. Customer tidak sedang mencari barang, dia minta penjelasan.
PENTING: pertanyaan tentang harga/nego/diskon/cicilan produk YANG SEDANG DILIHAT ("harganya berapa", "bisa kurang ga", "bisa nego?") juga BUKAN pencarian → output NO. Data harga produk itu sudah tersedia.

Contoh:
- "Ada sony a6400 ga" → Sony A6400
- "Kalau sony a6700 ada?" → Sony A6700
- "Punya lensa buat sony ga?" → lensa Sony
- (halaman Sony A6400) "min ada jual baterainya ga" → baterai NP-FW50
- (halaman Canon EOS RP) "chargernya ada?" → charger LP-E17
- (halaman Sony A6400) "ada lensa tele buat kamera ini?" → lensa tele Sony E-mount
- "Rekomendasi drone buat pemula dong" → drone DJI
- "bedanya sama a6400 apa min" → NO
- "bagusan mana sama x-s20?" → NO
- "mending ini atau zv-e10?" → NO
- "harganya berapa ya?" → NO
- "harga bisa kurang ga min?" → NO
- "Jam buka toko?" → NO
- "Bisa cicilan ga?" → NO
- "Kamera ini bagus buat vlog?" → NO
${currentProduct ? `\nCustomer sedang berada di halaman produk: "${currentProduct}"` : ''}${recentHistory ? `\nPercakapan terakhir:\n${recentHistory}` : ''}
Pertanyaan customer: "${question}"

Output:`;

    const routerRes = await router.generateContent(routerPrompt);
    const keyword = routerRes.response.text().trim().replace(/^["']|["']$/g, '');
    if (!keyword || keyword.toUpperCase() === 'NO' || keyword.length > 60) {
      return { contextText: '', products: [] };
    }
    console.log('[api.ask] product search keyword:', keyword);

    const data = await context.storefront.query(PRODUCT_SEARCH_QUERY, {
      variables: { searchTerm: keyword },
    });
    const items = data?.predictiveSearch?.products ?? [];

    if (items.length === 0) {
      return {
        contextText: `Customer mencari "${keyword}" tapi produk ini TIDAK DITEMUKAN di katalog toko — kemungkinan kami tidak menjualnya atau sudah tidak tersedia.
- Jawab jujur bahwa produk itu sepertinya tidak tersedia di toko kami
- Jika kamu tahu produk serupa yang umum kami jual (lihat daftar kategori produk di atas), tawarkan sebagai alternatif
- Sarankan konfirmasi ke admin di 0821-1131-1131 untuk memastikan`,
        products: [],
      };
    }

    const products = items.slice(0, 3).map(p => ({
      title: p.title,
      handle: p.handle,
      image: p.featuredImage?.url ?? null,
      price: Number(parseFloat(p.priceRange?.minVariantPrice?.amount ?? 0)),
      available: p.availableForSale,
    }));

    const list = products
      .map(p => `- ${p.title} | Rp${p.price.toLocaleString('id-ID')} | ${p.available ? 'Ready stock' : 'Stok habis'}`)
      .join('\n');

    return {
      contextText: `Hasil pencarian katalog toko untuk "${keyword}":
${list}
- PENTING: produk di atas akan OTOMATIS ditampilkan sebagai kartu bergambar (foto, harga, link) tepat di bawah jawabanmu. JANGAN tulis link dan JANGAN sebutkan semua harga satu per satu — cukup jawab natural dan singkat, contoh: "Ada kak, ready stock! Ini pilihannya ya 👇"
- Hanya relevan jika produknya SEJENIS dengan yang dicari customer. Jika customer cari kamera tapi hasil pencarian cuma aksesoris (baterai, tas, charger, dll), berarti kameranya tidak tersedia — jawab jujur tidak tersedia
- Jika stok habis, beri tahu stoknya habis`,
      products,
    };
  } catch (e) {
    console.error('[api.ask] product search failed:', e?.message ?? e);
    return { contextText: '', products: [] };
  }
}

export async function action({ request, context }) {
  const body = await request.json();
  const { question, productTitle, productPrice, productDescription, productSpecs, productIsiBox, productFreeBonus, productCicilan, productNego, productHandle, sessionId, conversationId, messages = [], isCustom = false } = body;

  if (!question) return json({ error: 'Missing question' }, { status: 400 });

  // Rate limit — protect Gemini quota from spam
  if (isRateLimited(sessionId)) {
    return json({
      answer: 'Maaf ka, terlalu banyak pertanyaan dalam waktu singkat 🙏 Tunggu sebentar ya, atau langsung hubungi admin kami di 0821-1131-1131 😊',
    });
  }

  // Bubble answer cache — bubble questions are fixed per product, so cache their answers
  // Only for first-click bubble questions (no history) since follow-ups depend on context
  const cacheId = !isCustom && productHandle && messages.length === 0
    ? `${productHandle}~ans~${simpleHash(question)}`
    : null;

  if (cacheId) {
    const cached = await firestoreGet('product_questions', cacheId);
    const cachedAnswer = cached?.answer?.stringValue;
    const cachedPrice = cached?.price?.stringValue ?? '';
    const cachedAt = cached?.cached_at?.timestampValue;
    const fresh = cachedAt && Date.now() - new Date(cachedAt).getTime() < 7 * 24 * 3600 * 1000;
    // Invalidate when the price changed (cicilan answers embed price estimates)
    if (cachedAnswer && fresh && cachedPrice === String(productPrice ?? '')) {
      // Still track the bubble click before returning
      await firestorePatch(`bubble_clicks/${productHandle}/questions`, encodeURIComponent(question), {
        question: fsString(question),
        count: { integerValue: 1 },
        last_clicked: fsTimestamp(),
      });
      return json({ answer: cachedAnswer, cached: true });
    }
  }

  const model = getGemini(context, { search: true });

  // Search catalog + fetch active vouchers in parallel
  const [storeSearch, activeVouchers] = await Promise.all([
    searchStoreProducts(context, question, messages, productTitle ?? ''),
    getActiveVouchers(context),
  ]);
  const storeSearchResults = storeSearch.contextText;
  const foundProducts = storeSearch.products.length > 0 ? storeSearch.products : undefined;

  const systemContext = `${storeKnowledge}

PRODUK YANG SEDANG DILIHAT CUSTOMER:
- Nama: ${productTitle ?? ''}
- Harga: ${productPrice ?? ''}
- Deskripsi: ${(productDescription ?? '').slice(0, 400)}
- Spesifikasi: ${(productSpecs ?? '').slice(0, 800)}
- Isi Paket/Box: ${(productIsiBox ?? '').slice(0, 300)}
${productFreeBonus ? `- Bonus Gratis KHUSUS produk ini (sedang berlaku, sebutkan ini saat customer tanya bonus/free): ${productFreeBonus.slice(0, 300)}` : ''}
${productCicilan ? `- Estimasi Cicilan:\n${productCicilan}` : ''}
${productNego ? `
PENAWARAN NEGO UNTUK PRODUK INI (gunakan HANYA saat customer minta nego/potongan/harga kurang/best price):
- ${productNego}
- Syarat: harga spesial ini KHUSUS pembelian langsung di toko (debit, cash, atau transfer) ATAU order manual via WhatsApp admin di 0821-1131-1131
- Saat customer minta nego: langsung tawarkan harga spesial ini, sebut nominal harga setelah potongan, dan jelaskan syaratnya
- JANGAN kasih potongan lebih besar dari ini. Jika customer minta lebih murah lagi, arahkan nego lanjut ke admin di 0821-1131-1131
- Jangan tawarkan harga nego ini kalau customer tidak minta nego` : ''}
${storeSearchResults ? `
INFO PENCARIAN KATALOG TOKO:
${storeSearchResults}` : ''}
${activeVouchers.length > 0 ? `
KODE VOUCHER AKTIF (khusus order via website):
${activeVouchers.map(v => `- ${v.code} | diskon ${v.discountType === 'percentage' ? v.discount + '%' : 'Rp' + Number(v.discount).toLocaleString('id-ID')}${v.minPurchase ? ' | min. belanja ' + v.minPurchase : ''}${v.expiryDate ? ' | berlaku s/d ' + v.expiryDate : ''}`).join('\n')}
- Jika customer berniat order/checkout via WEBSITE (atau setuju saat kamu tawarkan order via website), tawarkan voucher: bilang singkat "aku kasih voucher diskon ya ka 👇" lalu akhiri dengan marker [VOUCHER] persis seperti itu — marker otomatis diganti kartu voucher dengan tombol salin
- [VOUCHER] WAJIB di posisi PALING AKHIR jawaban — jangan ada kalimat, pertanyaan, atau "|||" apapun setelahnya
- JANGAN tulis kode voucher di teks jawaban, cukup marker [VOUCHER]
- Hanya tawarkan jika harga produk memenuhi min. belanja voucher` : ''}

INSTRUKSI:
- Kamu adalah SALES Galaxy Camera yang ramah dan jago closing — tujuanmu membantu customer sampai terjadi transaksi, bukan cuma menjawab pertanyaan
- Jawab dalam bahasa Indonesia yang friendly, seperti chat WhatsApp — santai dan natural
- Panggil customer dengan "ka" atau "kak"
- WAJIB SINGKAT: maksimal 2-3 kalimat pendek per jawaban. Ini chat, bukan artikel
- SELALU akhiri jawaban dengan SATU pertanyaan follow-up singkat yang mengarahkan ke transaksi, sesuai konteks. Contoh:
  * Setelah menunjukkan produk yang dicari → "Rencananya mau ambil langsung di toko atau order via website ka?"
  * Setelah jawab spesifikasi/perbandingan → "Rencananya buat dipakai apa ka, foto atau video?" (lalu arahkan ke produk yang cocok)
  * Setelah jawab cicilan → "Mau dibantu hitung tenor lain, atau langsung order ka?"
  * Setelah jawab garansi/bonus/ongkir → "Ada lagi yang mau ditanyakan, atau mau langsung diproses ka?"
- Jangan memaksa: jika customer bilang cuma tanya-tanya atau menolak, jawab santai dan tawarkan bantuan lain tanpa mengulang ajakan yang sama
- JANGAN mengulang pertanyaan follow-up yang sama yang sudah pernah kamu tanyakan di riwayat percakapan — jika customer tidak merespons ajakanmu sebelumnya, ganti pendekatan atau jawab saja tanpa ajakan
- Jika customer menutup percakapan ("makasih", "oke", "sip", "cuma tanya-tanya", dll): balas hangat dan singkat TANPA pertanyaan follow-up apapun, contoh: "Sama-sama ka! Kalau ada yang mau ditanyakan lagi, aku siap bantu 😊"
- JANGAN pakai format markdown (**, *, bullet list, nomor) — tulis kalimat biasa saja karena chat tidak bisa menampilkan format
- Jika pertanyaan customer luas dan jawabannya punya banyak opsi (contoh: "cara kredit gimana?"), JANGAN jelaskan semua opsi sekaligus. Jawab singkat lalu BALIK BERTANYA untuk mempersempit, contoh: "Bisa ka! Mau cicilan pakai kartu kredit atau tanpa kartu kredit?" Setelah customer pilih, baru jelaskan opsi itu saja dengan estimasi cicilannya dari data produk
- Jika customer sudah spesifik (contoh: "cicilan Kredivo 12x berapa?"), langsung jawab angka estimasinya dari data produk, singkat
- Jika jawaban terpaksa panjang, pecah jadi 2 pesan dengan separator "|||" (tanpa spasi di sekitarnya)
- Jika customer bertanya tentang Kredivo (syarat, cara daftar, limit): jawab singkat, lalu "|||", lalu panduan singkat: download aplikasi Kredivo → daftar dengan KTP → limit langsung diketahui
- Kamu BOLEH menjawab pakai pengetahuan umummu tentang kamera, lensa, dan elektronik — spesifikasi, perbandingan produk, baterai, fitur, dll — meskipun tidak ada di data produk
- Hanya arahkan ke admin untuk hal spesifik Galaxy Camera: stok terkini, approval cicilan, promo khusus, jadwal pickup, kondisi unit tertentu
- Jangan sebut marketplace (Shopee, Tokopedia, Blibli) secara proaktif — utamakan order via website. TAPI jika customer sendiri yang bertanya apakah bisa beli via marketplace, jawab bisa dan berikan link toko resmi kami dari knowledge di atas`;

  const historyText = messages.length > 0
    ? messages.map(m => `${m.role === 'user' ? 'Customer' : 'Admin'}: ${m.text}`).join('\n')
    : '';

  const fullPrompt = `${systemContext}\n\n${historyText ? `Riwayat percakapan:\n${historyText}\n\n` : ''}Customer: ${question}`;

  let answer = '';
  try {
    const result = await model.generateContent(fullPrompt);
    answer = result.response.text().trim();
  } catch (e) {
    console.error('[api.ask] answer generation failed:', e?.message ?? e);
    answer = 'Maaf ka, ada gangguan teknis. Untuk info lebih lanjut, silakan hubungi admin kami di 0821-1131-1131 😊';
  }

  // [VOUCHER] marker → strip it and attach voucher cards to the response
  let responseVouchers;
  if (answer.includes('[VOUCHER]')) {
    responseVouchers = activeVouchers.length > 0 ? activeVouchers : undefined;
    answer = answer.replace(/\s*\[VOUCHER\]\s*/g, ' ').replace(/ +/g, ' ').trim();
  }

  // Save bubble answer to cache — only plain text answers without cards or errors
  if (cacheId && !foundProducts && !responseVouchers && !answer.includes('gangguan teknis')) {
    await firestorePatch('product_questions', cacheId, {
      answer: fsString(answer),
      price: fsString(String(productPrice ?? '')),
      cached_at: fsTimestamp(),
    });
  }

  // Save conversation to Firestore (for "Tanya Hal Lain" / custom questions)
  if (isCustom && sessionId) {
    const newMessage = [
      { role: fsString('user'), text: fsString(question), time: fsTimestamp() },
      { role: fsString('ai'), text: fsString(answer), time: fsTimestamp() },
    ];

    if (conversationId) {
      // Append to existing conversation — fetch current messages first
      const existing = await firestoreGet('conversations', conversationId);
      const currentMsgs = existing?.messages?.arrayValue?.values ?? [];
      const updatedMsgs = [
        ...currentMsgs,
        ...newMessage.map(m => ({
          mapValue: {
            fields: {
              role: m.role,
              text: m.text,
              time: m.time,
            },
          },
        })),
      ];
      await firestorePatch('conversations', conversationId, {
        messages: { arrayValue: { values: updatedMsgs } },
        updated_at: fsTimestamp(),
      });
    } else {
      // Create new conversation — include prior chat history (e.g. bubble Q&A before the customer typed)
      const historyMaps = messages.map(m => ({
        mapValue: {
          fields: {
            role: fsString(m.role === 'user' ? 'user' : 'ai'),
            text: fsString(m.text ?? ''),
            time: fsTimestamp(),
          },
        },
      }));
      const newConvId = await firestoreCreate('conversations', {
        session_id: fsString(sessionId),
        product_handle: fsString(productHandle ?? ''),
        product_title: fsString(productTitle ?? ''),
        created_at: fsTimestamp(),
        updated_at: fsTimestamp(),
        messages: {
          arrayValue: {
            values: [
              ...historyMaps,
              ...newMessage.map(m => ({
                mapValue: {
                  fields: {
                    role: m.role,
                    text: m.text,
                    time: m.time,
                  },
                },
              })),
            ],
          },
        },
      });
      return json({ answer, conversationId: newConvId, products: foundProducts, vouchers: responseVouchers });
    }
  }

  // Track bubble click (non-custom questions)
  if (!isCustom && productHandle) {
    await firestorePatch(`bubble_clicks/${productHandle}/questions`, encodeURIComponent(question), {
      question: fsString(question),
      count: { integerValue: 1 },
      last_clicked: fsTimestamp(),
    }).catch(() => {});
  }

  return json({ answer, products: foundProducts, vouchers: responseVouchers });
}
