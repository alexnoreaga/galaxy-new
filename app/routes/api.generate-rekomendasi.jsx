import { json } from '@shopify/remix-oxygen';

export async function action({ request, context }) {
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, { status: 405 });

  try {
    const { title, products } = await request.json();

    const geminiApiKey = context.env?.GEMINI_API_KEY || process.env.GEMINI_API_KEY;
    if (!geminiApiKey) return json({ error: 'Gemini API key not configured' }, { status: 500 });

    const productList = products.map((p, i) =>
      `${i + 1}. ${p.title} (Harga: ${p.price ? `Rp ${parseFloat(p.price).toLocaleString('id-ID')}` : 'lihat di toko'}, Handle: ${p.handle})`
    ).join('\n');

    const prompt = `Kamu editor majalah kamera Indonesia. Tulis artikel rekomendasi produk dalam JSON. Output HANYA JSON valid, tanpa teks lain.

Judul: "${title}"
Produk:
${productList}

Format JSON:
{
  "intro": "2 paragraf pembuka menarik tentang konteks artikel ini, bahasa Indonesia natural",
  "products": [
    {
      "handle": "handle persis dari input",
      "verdict": "2-4 kata keunggulan utama (cth: Terbaik untuk Pemula, Nilai Terbaik, Pilihan Pro)",
      "verdictColor": "blue|green|amber|purple|rose|orange",
      "tagline": "1 kalimat kenapa produk ini masuk daftar",
      "editorial": "2 paragraf tentang produk: siapa cocok menggunakannya, keunggulan utama, posisi vs produk lain di daftar ini",
      "pros": ["keunggulan 1", "keunggulan 2", "keunggulan 3"],
      "cons": ["kelemahan 1", "kelemahan 2"],
      "whoFor": "1 kalimat: paling cocok untuk siapa"
    }
  ],
  "conclusion": "1-2 paragraf penutup dengan panduan memilih"
}

Aturan: handle di output harus sama persis dengan input. Bahasa Indonesia natural. Output HANYA JSON.`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 55000);

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.4 },
        }),
      }
    );
    clearTimeout(timeout);

    if (!res.ok) {
      const errText = await res.text();
      console.error('Gemini API error:', errText);
      return json({ error: 'Gemini API error' }, { status: 500 });
    }

    const geminiData = await res.json();
    const text = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return json({ error: 'Invalid AI response' }, { status: 500 });

    const rekomendasi = JSON.parse(jsonMatch[0]);
    return json({ rekomendasi });

  } catch (error) {
    console.error('Error generating rekomendasi:', error);
    return json({ error: 'Gagal membuat rekomendasi: ' + error.message }, { status: 500 });
  }
}
