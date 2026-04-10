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

    const prompt = `Kamu adalah editor konten ahli di bidang kamera, drone, dan aksesoris fotografi untuk pasar Indonesia. Tugasmu adalah menulis artikel rekomendasi produk yang informatif, menarik, dan sangat membantu calon pembeli.

PENTING: Gunakan Google Search untuk mencari informasi terbaru tentang setiap produk sebelum menulis. Cari:
- Spesifikasi resmi dari situs produsen
- Review dari fotografer/videografer profesional
- Keunggulan dan kelemahan nyata dari pengguna
- Posisi produk di pasar Indonesia

Judul artikel rekomendasi: "${title}"

Produk yang direkomendasikan:
${productList}

Tulis artikel rekomendasi dalam format JSON berikut (hanya output JSON, tidak ada teks lain):

{
  "intro": "2-3 paragraf pembuka yang menarik — jelaskan konteks artikel, siapa target pembaca, dan apa yang akan mereka temukan. Tulis seperti editor majalah kamera profesional, bukan robot. Gunakan bahasa Indonesia natural.",
  "products": [
    {
      "handle": "handle produk persis seperti di input",
      "verdict": "Label singkat 2-4 kata yang menggambarkan keunggulan utama produk ini dalam konteks daftar ini. Contoh: Terbaik untuk Pemula, Nilai Terbaik, Pilihan Pro, Paling Ringkas, Terkuat di Kelasnya",
      "verdictColor": "Pilih salah satu: blue, green, amber, purple, rose, orange — sesuai karakter produk (blue=andalan, green=value, amber=budget, purple=pro, rose=lifestyle, orange=action/sport)",
      "tagline": "1 kalimat yang langsung menjelaskan kenapa produk ini masuk daftar ini",
      "editorial": "3-4 paragraf editorial yang mendalam tentang produk ini. Jelaskan: siapa yang cocok menggunakannya, apa keunggulan utamanya, pengalaman real-world penggunaannya, dan posisinya dibandingkan pilihan lain dalam daftar ini. Tulis dengan gaya jurnalisme kamera yang engaging.",
      "pros": ["keunggulan spesifik 1", "keunggulan spesifik 2", "keunggulan spesifik 3"],
      "cons": ["kelemahan jujur 1", "kelemahan jujur 2"],
      "whoFor": "1 kalimat spesifik: produk ini paling cocok untuk siapa"
    }
  ],
  "conclusion": "2-3 paragraf penutup yang merangkum keseluruhan daftar, memberikan panduan akhir untuk memilih, dan mendorong pembaca untuk mengambil keputusan. Jujur dan membantu."
}

Aturan ketat:
- Setiap editorial harus unik dan spesifik — jangan copy-paste struktur yang sama
- Pros dan cons harus jujur dan berdasarkan fakta nyata, bukan generik
- Bahasa Indonesia yang natural, hangat, tidak kaku — seperti tulisan di majalah kamera
- Jika produk sangat baru dan data terbatas, sebutkan dengan jujur
- Output HANYA JSON valid, tidak ada teks lain di luar JSON
- Handle di output harus persis sama dengan handle di input`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          tools: [{ google_search: {} }],
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
    if (!jsonMatch) return json({ error: 'Invalid AI response' }, { status: 500 });

    const rekomendasi = JSON.parse(jsonMatch[0]);
    return json({ rekomendasi });

  } catch (error) {
    console.error('Error generating rekomendasi:', error);
    return json({ error: 'Gagal membuat rekomendasi: ' + error.message }, { status: 500 });
  }
}
