import { json } from '@shopify/remix-oxygen';

export async function action({ request, context }) {
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const { productA, productB } = await request.json();

    const geminiApiKey = context.env?.GEMINI_API_KEY || process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      return json({ error: 'Gemini API key not configured' }, { status: 500 });
    }

    const formatProduct = (p) => `
Nama: ${p.title}
Brand: ${p.vendor || '-'}
Kategori: ${p.productType || '-'}
Garansi: ${p.garansi || '-'}
Deskripsi: ${p.description || '-'}
Spesifikasi: ${p.specs || '-'}
    `.trim();

    const prompt = `Kamu adalah expert reviewer produk kamera, drone, dan aksesoris fotografi terpercaya di Indonesia. Tugasmu adalah membuat perbandingan produk yang sangat informatif, jujur, dan membantu calon pembeli membuat keputusan terbaik.

PENTING: Gunakan Google Search untuk mencari informasi terbaru tentang kedua produk ini sebelum menjawab. Cari:
- Spesifikasi resmi dan lengkap dari situs produsen
- Review terbaru dari fotografer dan videografer profesional
- Perbandingan real-world dari YouTube, DPReview, PetaPixel, atau media kamera terpercaya
- Harga pasaran terkini di Indonesia
- Keluhan atau keunggulan yang sering disebut pengguna nyata

Jika salah satu atau kedua produk adalah produk BARU (rilis dalam 12 bulan terakhir), pastikan kamu mencari info terbaru karena data lama mungkin tidak akurat.

Bandingkan dua produk berikut:

PRODUK A:
${formatProduct(productA)}

PRODUK B:
${formatProduct(productB)}

Buat perbandingan lengkap dalam format JSON berikut (hanya output JSON, tidak ada teks lain):

{
  "shortNameA": "Nama pendek UNIK untuk Produk A, maksimal 3 kata, harus bisa membedakannya dari Produk B. Contoh: jika A='Fujifilm Instax Mini Evo' dan B='Fujifilm Instax Mini Liplay', maka shortNameA='Mini Evo'. Jika A='Sony ZV-E10 II' dan B='Canon EOS M50 Mark II', maka shortNameA='ZV-E10 II'.",
  "shortNameB": "Nama pendek UNIK untuk Produk B, sama seperti aturan shortNameA.",
  "intro": "2-3 kalimat pembuka yang menarik tentang kedua produk ini dan kenapa perbandingan ini penting bagi pembeli di Indonesia",
  "categories": [
    {
      "name": "Nama kategori spesifik dan relevan (contoh: Sensor & Kualitas Foto, Kemampuan Video, Autofocus, Stabilisasi, Portabilitas, Daya Tahan Baterai, Harga & Value)",
      "winner": "A atau B",
      "reason": "1-2 kalimat penjelasan berdasarkan spesifikasi dan review nyata, bukan asumsi"
    }
  ],
  "verdict": {
    "chooseA": ["alasan spesifik 1 berdasarkan fakta", "alasan 2", "alasan 3"],
    "chooseB": ["alasan spesifik 1 berdasarkan fakta", "alasan 2", "alasan 3"]
  },
  "conclusion": "1-2 kalimat kesimpulan yang langsung dan membantu pembaca Indonesia memutuskan"
}

Aturan ketat:
- shortNameA dan shortNameB WAJIB berbeda dan mudah dibedakan
- Gunakan data aktual dari pencarian, bukan asumsi atau data lama
- Jika ada spesifikasi yang kamu tidak yakin kebenarannya karena produk terlalu baru, katakan "berdasarkan informasi yang tersedia" — jangan mengarang
- Bahasa Indonesia natural, tidak kaku, tidak terlalu formal
- categories harus antara 5-7 item yang relevan dengan tipe produk ini
- Jujur dan berani — jika satu produk jelas menang, katakan dengan tegas
- Output HANYA JSON valid, tidak ada teks lain di luar JSON`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 55000); // 55s timeout

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          tools: [{ google_search: {} }],
          generationConfig: { temperature: 0.3 },
        }),
      }
    );
    clearTimeout(timeout);

    if (!res.ok) {
      const errText = await res.text();
      console.error('Gemini API error:', errText);
      return json({ error: 'Gemini API error', detail: errText }, { status: 500 });
    }

    const geminiData = await res.json();
    const text = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('No JSON in Gemini response:', text);
      return json({ error: 'Invalid AI response' }, { status: 500 });
    }

    const comparison = JSON.parse(jsonMatch[0]);
    return json({ comparison });

  } catch (error) {
    console.error('Error generating comparison:', error);
    return json({ error: 'Gagal membuat perbandingan' }, { status: 500 });
  }
}
