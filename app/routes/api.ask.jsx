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

const GEMINI_API_KEY_FALLBACK = 'AIzaSyDt5xeKHzYfHOEp4RnBjUPze96l_voJgpY';

function getGemini(context, { search = false } = {}) {
  const apiKey =
    context?.env?.GEMINI_API_KEY ??
    (typeof process !== 'undefined' ? process.env?.GEMINI_API_KEY : undefined) ??
    GEMINI_API_KEY_FALLBACK;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set in environment');
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    ...(search ? { tools: [{ googleSearch: {} }] } : {}),
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

export async function action({ request, context }) {
  const body = await request.json();
  const { question, productTitle, productPrice, productDescription, productSpecs, productIsiBox, productCicilan, productHandle, sessionId, conversationId, messages = [], isCustom = false } = body;

  if (!question) return json({ error: 'Missing question' }, { status: 400 });

  const model = getGemini(context, { search: true });

  const systemContext = `${storeKnowledge}

PRODUK YANG SEDANG DILIHAT CUSTOMER:
- Nama: ${productTitle ?? ''}
- Harga: ${productPrice ?? ''}
- Deskripsi: ${(productDescription ?? '').slice(0, 400)}
- Spesifikasi: ${(productSpecs ?? '').slice(0, 800)}
- Isi Paket/Box: ${(productIsiBox ?? '').slice(0, 300)}
${productCicilan ? `- Estimasi Cicilan:\n${productCicilan}` : ''}

INSTRUKSI:
- Jawab dalam bahasa Indonesia yang friendly
- Panggil customer dengan "ka" atau "kak"
- Jawab singkat dan langsung ke inti (maks 3 kalimat)
- Kamu BOLEH menjawab menggunakan pengetahuan umummu tentang kamera, lensa, dan elektronik — termasuk spesifikasi teknis, perbandingan produk, daya tahan baterai, resolusi video, fitur, dll — meskipun tidak tercantum di data produk di atas
- Jika customer bertanya tentang cicilan (syarat, cara, tenor, berapa per bulan, dll): sebutkan tenor yang tersedia, estimasi cicilan per bulan dari data produk di atas, dan cara prosesnya (online/ke toko) sesuai metode yang ditanya
- Jika customer bertanya tentang Kredivo (syarat, cara daftar, limit, dll): jawab pertanyaannya dulu, lalu tambahkan tepat separator "|||" (tanpa spasi di sekitarnya), lalu tulis panduan singkat cara mulai Kredivo: download aplikasi Kredivo → daftar dengan KTP → limit akan langsung diketahui. Tulis panduan ini sebagai pesan terpisah yang singkat dan friendly
- Hanya arahkan ke admin untuk hal-hal spesifik Galaxy Camera: stok terkini, approval cicilan, promo khusus, jadwal pickup, atau kondisi unit tertentu
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
    const errMsg = e?.message ?? String(e);
    console.error('[api.ask] answer generation failed:', errMsg);
    answer = `Maaf ka, ada gangguan teknis. Untuk info lebih lanjut, silakan hubungi admin kami di 0821-1131-1131 😊\n\n[debug: ${errMsg}]`;
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
      // Create new conversation
      const newConvId = await firestoreCreate('conversations', {
        session_id: fsString(sessionId),
        product_handle: fsString(productHandle ?? ''),
        product_title: fsString(productTitle ?? ''),
        created_at: fsTimestamp(),
        updated_at: fsTimestamp(),
        messages: {
          arrayValue: {
            values: newMessage.map(m => ({
              mapValue: {
                fields: {
                  role: m.role,
                  text: m.text,
                  time: m.time,
                },
              },
            })),
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
