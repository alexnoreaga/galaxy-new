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
query searchProducts($query: String!, $first: Int!) {
  products(first: $first, query: $query) {
    nodes {
      title
      handle
      availableForSale
      priceRange { minVariantPrice { amount } }
    }
  }
}`;

// Detect whether the customer is asking about other products, and search the store catalog
async function searchStoreProducts(context, question, messages) {
  try {
    const router = getGemini(context, { search: false, temperature: 0 });
    const recentHistory = messages.slice(-2).map(m => `${m.role === 'user' ? 'Customer' : 'Admin'}: ${m.text}`).join('\n');
    const routerPrompt = `Kamu adalah router pencarian untuk toko kamera online. Tugasmu HANYA menentukan apakah customer menanyakan ketersediaan, harga, atau rekomendasi suatu produk (kamera, lensa, drone, aksesoris, dll). Jika ya, output kata kunci pencarian produknya (2-5 kata). Jika tidak, output: NO

Contoh:
- "Ada sony a6400 ga" → Sony A6400
- "Kalau sony a6700 ada?" → Sony A6700
- "Punya lensa buat sony ga?" → lensa Sony
- "Rekomendasi drone buat pemula dong" → drone DJI
- "Jam buka toko?" → NO
- "Bisa cicilan ga?" → NO
- "Kamera ini bagus buat vlog?" → NO
${recentHistory ? `\nPercakapan terakhir:\n${recentHistory}\n` : ''}
Pertanyaan customer: "${question}"

Output:`;

    const routerRes = await router.generateContent(routerPrompt);
    const keyword = routerRes.response.text().trim().replace(/^["']|["']$/g, '');
    if (!keyword || keyword.toUpperCase() === 'NO' || keyword.length > 60) return '';
    console.log('[api.ask] product search keyword:', keyword);

    const data = await context.storefront.query(PRODUCT_SEARCH_QUERY, {
      variables: { query: keyword, first: 5 },
    });
    const items = data?.products?.nodes ?? [];

    if (items.length === 0) {
      return `Customer mencari "${keyword}" tapi produk ini TIDAK DITEMUKAN di katalog toko — kemungkinan kami tidak menjualnya atau sudah tidak tersedia.
- Jawab jujur bahwa produk itu sepertinya tidak tersedia di toko kami
- Jika kamu tahu produk serupa yang umum kami jual (lihat daftar kategori produk di atas), tawarkan sebagai alternatif
- Sarankan konfirmasi ke admin di 0821-1131-1131 untuk memastikan`;
    }

    const list = items
      .map(p => {
        const price = Number(parseFloat(p.priceRange?.minVariantPrice?.amount ?? 0));
        return `- ${p.title} | Rp${price.toLocaleString('id-ID')} | ${p.availableForSale ? 'Ready stock' : 'Stok habis'} | https://www.galaxy.co.id/products/${p.handle}`;
      })
      .join('\n');

    return `Hasil pencarian katalog toko untuk "${keyword}":
${list}
- Gunakan data ini untuk menjawab. Sebutkan maksimal 2-3 produk paling relevan beserta harga dan link-nya (tulis link apa adanya, jangan pakai format markdown)
- PENTING: hanya tawarkan produk yang SEJENIS dengan yang dicari customer. Jika customer cari kamera tapi hasil pencarian cuma aksesoris (baterai, tas, charger, dll), berarti kameranya tidak tersedia — jawab jujur tidak tersedia, jangan tawarkan aksesoris sebagai pengganti
- Jika produk yang dicari tidak ada tapi kamu tahu model serupa yang biasa kami jual, boleh sarankan customer cek model itu
- Jika stok habis, tetap boleh disebut tapi beri tahu stoknya habis`;
  } catch (e) {
    console.error('[api.ask] product search failed:', e?.message ?? e);
    return '';
  }
}

export async function action({ request, context }) {
  const body = await request.json();
  const { question, productTitle, productPrice, productDescription, productSpecs, productIsiBox, productCicilan, productHandle, sessionId, conversationId, messages = [], isCustom = false } = body;

  if (!question) return json({ error: 'Missing question' }, { status: 400 });

  const model = getGemini(context, { search: true });

  // Search the store catalog if the customer is asking about other products
  const storeSearchResults = await searchStoreProducts(context, question, messages);

  const systemContext = `${storeKnowledge}

PRODUK YANG SEDANG DILIHAT CUSTOMER:
- Nama: ${productTitle ?? ''}
- Harga: ${productPrice ?? ''}
- Deskripsi: ${(productDescription ?? '').slice(0, 400)}
- Spesifikasi: ${(productSpecs ?? '').slice(0, 800)}
- Isi Paket/Box: ${(productIsiBox ?? '').slice(0, 300)}
${productCicilan ? `- Estimasi Cicilan:\n${productCicilan}` : ''}
${storeSearchResults ? `
INFO PENCARIAN KATALOG TOKO:
${storeSearchResults}` : ''}

INSTRUKSI:
- Jawab dalam bahasa Indonesia yang friendly, seperti chat WhatsApp — santai dan natural
- Panggil customer dengan "ka" atau "kak"
- WAJIB SINGKAT: maksimal 2-3 kalimat pendek per jawaban. Ini chat, bukan artikel
- JANGAN pakai format markdown (**, *, bullet list, nomor) — tulis kalimat biasa saja karena chat tidak bisa menampilkan format
- Jika pertanyaan customer luas dan jawabannya punya banyak opsi (contoh: "cara kredit gimana?"), JANGAN jelaskan semua opsi sekaligus. Jawab singkat lalu BALIK BERTANYA untuk mempersempit, contoh: "Bisa ka! Mau cicilan pakai kartu kredit atau tanpa kartu kredit?" Setelah customer pilih, baru jelaskan opsi itu saja dengan estimasi cicilannya dari data produk
- Jika customer sudah spesifik (contoh: "cicilan Kredivo 12x berapa?"), langsung jawab angka estimasinya dari data produk, singkat
- Jika jawaban terpaksa panjang, pecah jadi 2 pesan dengan separator "|||" (tanpa spasi di sekitarnya)
- Jika customer bertanya tentang Kredivo (syarat, cara daftar, limit): jawab singkat, lalu "|||", lalu panduan singkat: download aplikasi Kredivo → daftar dengan KTP → limit langsung diketahui
- Kamu BOLEH menjawab pakai pengetahuan umummu tentang kamera, lensa, dan elektronik — spesifikasi, perbandingan produk, baterai, fitur, dll — meskipun tidak ada di data produk
- Hanya arahkan ke admin untuk hal spesifik Galaxy Camera: stok terkini, approval cicilan, promo khusus, jadwal pickup, kondisi unit tertentu
- Jangan sebut nama marketplace (Shopee, Tokopedia, dll)`;

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
      return json({ answer, conversationId: newConvId });
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

  return json({ answer });
}
