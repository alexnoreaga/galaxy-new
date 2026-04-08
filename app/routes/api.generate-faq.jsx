import { json } from '@shopify/remix-oxygen';

export async function action({ request, context }) {
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const { productTitle, productDescription, productVendor, productType, metafields } = await request.json();

    const geminiApiKey = context.env?.GEMINI_API_KEY || process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      return json({ error: 'Gemini API key not configured' }, { status: 500 });
    }

    const productInfo = `
Nama Produk: ${productTitle}
Brand/Vendor: ${productVendor || '-'}
Kategori: ${productType || '-'}
${metafields?.garansi ? `Garansi: ${metafields.garansi}` : ''}
${metafields?.bonus ? `Bonus/Hadiah: ${metafields.bonus}` : ''}
Deskripsi Produk:
${productDescription || 'Tidak ada deskripsi.'}
    `.trim();

    const prompt = `Kamu adalah expert reviewer produk kamera, drone, dan aksesoris fotografi yang sangat berpengalaman di Indonesia.

LANGKAH PERTAMA: Gunakan Google Search untuk mencari informasi terbaru tentang "${productTitle}" — cari spesifikasi resmi, review dari fotografer profesional, pertanyaan yang sering muncul di forum kamera Indonesia (Kaskus, Facebook Group kamera), YouTube, dan marketplace seperti Tokopedia/Shopee. Jika ini produk baru (rilis dalam 12 bulan terakhir), pastikan mencari info terbaru karena data lama mungkin tidak akurat.

LANGKAH KEDUA: Tentukan KATEGORI produk ini (kamera mirrorless, DSLR, drone, action camera, lensa, tripod, dll), lalu buat 10 pertanyaan yang paling SERING dan PALING PENTING ditanyakan calon pembeli Indonesia untuk produk ini secara spesifik.

Panduan pertanyaan berdasarkan kategori:
- KAMERA (mirrorless/DSLR): ketahanan baterai (berapa foto per charge), performa low light, kemampuan video (4K/slow-mo/6K), apakah cocok untuk pemula, kompatibilitas lensa, apakah body only atau kit, fitur unggulan vs generasi sebelumnya
- DRONE: durasi terbang per baterai, jangkauan sinyal, kestabilan di angin, kualitas kamera/gimbal, apakah butuh izin terbang di Indonesia, apakah foldable, obstacle avoidance
- ACTION CAMERA: waterproof/tahan air berapa meter, stabilisasi gambar (EIS/HyperSmooth), kapasitas baterai, kompatibilitas mount/aksesoris, kemampuan live streaming
- LENSA: kompatibilitas mount kamera, apakah ada OIS/IS, sharpness di bukaan terbesar, apakah cocok untuk portrait/landscape/video, autofocus speed
- AKSESORIS LAIN: kompatibilitas, build quality, apakah worth it vs merek lain

Aturan jawaban:
- Gunakan informasi dari hasil pencarian Google — jawaban harus akurat dan up-to-date
- Prioritaskan info spesifik dari deskripsi produk yang diberikan
- Jika produk terlalu baru dan info terbatas, jawab sejujurnya dan tambahkan "Untuk konfirmasi lebih lanjut, silakan hubungi toko kami"
- Bahasa Indonesia yang natural, seperti orang yang benar-benar paham kamera berbicara ke temannya — tidak kaku, tidak terlalu formal
- Jawaban harus spesifik untuk produk ini, bukan jawaban generik
- Format output: JSON array dengan objek { "question": "...", "answer": "..." }
- Hanya output JSON saja, tanpa teks lain

Informasi Produk:
${productInfo}

Output JSON:`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          tools: [{ google_search: {} }],
          generationConfig: { temperature: 0.2 },
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

    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error('No JSON in Gemini response:', text);
      return json({ error: 'Invalid AI response' }, { status: 500 });
    }

    const faqs = JSON.parse(jsonMatch[0]);
    return json({ faqs });

  } catch (error) {
    console.error('Error generating FAQ:', error);
    return json({ error: 'Gagal membuat FAQ' }, { status: 500 });
  }
}
