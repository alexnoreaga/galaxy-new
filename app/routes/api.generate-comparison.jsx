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

    const prompt = `Kamu adalah expert reviewer produk kamera, drone, dan aksesoris fotografi terpercaya di Indonesia. Tugasmu adalah membuat artikel perbandingan produk yang sangat informatif, jujur, dan membantu calon pembeli membuat keputusan terbaik.

Bandingkan dua produk berikut:

PRODUK A:
${formatProduct(productA)}

PRODUK B:
${formatProduct(productB)}

Buat perbandingan lengkap dalam format JSON berikut (hanya output JSON, tidak ada teks lain):

{
  "shortNameA": "Nama pendek UNIK untuk Produk A, maksimal 3 kata, harus bisa membedakannya dari Produk B. Contoh: jika A='Fujifilm Instax Mini Evo' dan B='Fujifilm Instax Mini Liplay', maka shortNameA='Mini Evo'. Jika A='Sony ZV-E10 II' dan B='Canon EOS M50 Mark II', maka shortNameA='ZV-E10 II'.",
  "shortNameB": "Nama pendek UNIK untuk Produk B, sama seperti aturan shortNameA.",
  "intro": "2-3 kalimat pembuka yang menarik tentang kedua produk ini dan kenapa perbandingan ini penting",
  "categories": [
    {
      "name": "Nama kategori (contoh: Kualitas Foto, Kemampuan Video, Portabilitas, Harga, Kemudahan Penggunaan, Build Quality)",
      "winner": "A atau B",
      "reason": "1-2 kalimat penjelasan singkat kenapa produk ini menang di kategori ini"
    }
  ],
  "verdict": {
    "chooseA": ["alasan 1", "alasan 2", "alasan 3"],
    "chooseB": ["alasan 1", "alasan 2", "alasan 3"]
  },
  "conclusion": "1-2 kalimat kesimpulan keseluruhan yang membantu pembaca memutuskan"
}

Aturan:
- shortNameA dan shortNameB WAJIB berbeda satu sama lain dan mudah dibedakan
- Gunakan pengetahuan umum yang akurat tentang produk ini
- Jangan mengarang spesifikasi teknis yang tidak ada
- Bahasa Indonesia yang natural, informatif, tidak kaku
- categories harus antara 5-7 item
- Jujur — jika satu produk jelas lebih baik, katakan itu
- Hanya output JSON valid`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.4 },
        }),
      }
    );

    if (!res.ok) {
      const errText = await res.text();
      console.error('Gemini API error:', errText);
      return json({ error: 'Gemini API error' }, { status: 500 });
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
