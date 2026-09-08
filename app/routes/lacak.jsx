import {json} from '@shopify/remix-oxygen';
import {useLoaderData, Form, useNavigation} from '@remix-run/react';
import {useState} from 'react';
import {lookupOrder} from '~/lib/lacakOrder';

// Customer order-tracking page — reads OUR own website_orders (via the harga-produk
// /api/lacak endpoint, which uses a service account) instead of a paid courier API.
// Shows "diterima → dikirim" + resi from our side; live parcel position is one tap
// away on the courier's own site. Same lookup powers Grisela's order-status answers.

export const meta = () => [
  {title: 'Lacak Paket — Galaxy Camera'},
  {name: 'robots', content: 'noindex'},
];

export async function loader({request, context}) {
  const url = new URL(request.url);
  const resi = (url.searchParams.get('resi') ?? '').trim();
  const kurir = (url.searchParams.get('kurir') ?? '').trim();
  const hp = (url.searchParams.get('hp') ?? '').trim();

  let result = null;
  let error = '';
  if (resi && hp) {
    const res = await lookupOrder(resi, hp, context.env);
    if (res.ok) result = res.order;
    else error = res.error;
  }
  return json({resi, kurir, hp, result, error}, {headers: {'Cache-Control': 'no-store'}});
}

// Official courier pages for the live position (they verify phone themselves — fine,
// it's the customer's own number).
function courierUrl(kurir, resi) {
  const k = (kurir || '').toLowerCase();
  const r = encodeURIComponent(resi);
  if (k.includes('jne')) return `https://www.jne.co.id/id/tracking/trace?rc=${r}`;
  if (k.includes('j&t') || k.includes('jnt')) return `https://www.jet.co.id/track?awb=${r}`;
  if (k.includes('sicepat')) return `https://www.sicepat.com/checkAwb?awb=${r}`;
  if (k.includes('anteraja')) return `https://anteraja.id/tracking?resi=${r}`;
  if (k.includes('pos')) return `https://www.posindonesia.co.id/id/tracking?resi=${r}`;
  if (k.includes('ninja')) return `https://www.ninjaxpress.co/id-id/tracking?id=${r}`;
  return `https://cekresi.com/?noresi=${r}`;
}

const fmt = (iso) => {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString('id-ID', {day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta'}) + ' WIB';
  } catch {
    return iso;
  }
};

function CopyResi({resi}) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try { await navigator.clipboard.writeText(resi); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch {}
      }}
      className="text-[11px] font-semibold px-2.5 py-1 rounded-md border border-gray-200 bg-white text-gray-600 hover:border-gray-400 transition-colors"
    >
      {copied ? '✓ Tersalin' : 'Salin'}
    </button>
  );
}

export default function Lacak() {
  const {resi, kurir, hp, result, error} = useLoaderData();
  const nav = useNavigation();
  const busy = nav.state !== 'idle';
  const shipped = result?.status === 'dikirim';
  const eksp = result?.ekspedisi || kurir;

  return (
    <div className="bg-gray-50 min-h-[70vh]">
      {/* Hero — house charcoal */}
      <div className="bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#263447] text-white">
        <div className="max-w-xl mx-auto px-4 py-8 sm:py-10">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-300/90">Galaxy Camera</p>
          <h1 className="text-2xl sm:text-3xl font-extrabold mt-1 m-0">Lacak Paket</h1>
          <p className="text-sm text-white/70 mt-2 m-0">Masukkan nomor resi dan No HP yang dipakai saat order.</p>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 -mt-5 pb-14">
        {/* Form */}
        <Form method="get" className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-5 space-y-3">
          {kurir && <input type="hidden" name="kurir" value={kurir} />}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wide text-gray-500">Nomor Resi</label>
            <input name="resi" defaultValue={resi} required placeholder="Contoh: JNE1234567890" className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm font-mono outline-none focus:ring-2 focus:ring-rose-500" />
          </div>
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wide text-gray-500">No HP saat order</label>
            <input name="hp" defaultValue={hp} required inputMode="tel" placeholder="08xx xxxx xxxx" className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-rose-500" />
          </div>
          <button type="submit" disabled={busy} className="w-full bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white font-bold text-sm py-2.5 rounded-lg transition-colors">
            {busy ? 'Mencari…' : 'Lacak Paket'}
          </button>
          {error && <p className="text-xs text-rose-600 leading-snug m-0">{error}</p>}
        </Form>

        {/* Result */}
        {result && (
          <div className="mt-4 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-4 sm:px-5 pt-4 pb-3 border-b border-gray-100">
              <p className="text-sm text-gray-600 m-0">Halo <span className="font-bold text-gray-900">{result.nama}</span> 👋</p>
              <p className={`text-lg font-extrabold mt-0.5 m-0 ${shipped ? 'text-emerald-700' : 'text-amber-700'}`}>
                {shipped ? 'Paket kamu sudah dikirim 🚚' : 'Pesanan kamu sedang kami siapkan 📦'}
              </p>
            </div>

            {/* Timeline */}
            <ol className="px-4 sm:px-5 py-4 m-0 list-none space-y-4">
              <li className="flex gap-3">
                <span className="mt-0.5 w-5 h-5 rounded-full bg-emerald-500 text-white text-[11px] flex items-center justify-center flex-shrink-0">✓</span>
                <div>
                  <p className="text-sm font-bold text-gray-900 m-0">Pesanan diterima</p>
                  <p className="text-xs text-gray-500 m-0">{fmt(result.createdAt)}</p>
                  {result.order && <p className="text-xs text-gray-600 mt-1 m-0">{result.order}</p>}
                </div>
              </li>
              <li className="flex gap-3">
                <span className={`mt-0.5 w-5 h-5 rounded-full text-white text-[11px] flex items-center justify-center flex-shrink-0 ${shipped ? 'bg-emerald-500' : 'bg-gray-300'}`}>{shipped ? '✓' : '…'}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-gray-900 m-0">{shipped ? `Dikirim via ${eksp}` : 'Menunggu pengiriman'}</p>
                  {shipped ? (
                    <>
                      <p className="text-xs text-gray-500 m-0">{fmt(result.shippedAt)}</p>
                      <div className="mt-2 flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-rose-700 text-base tracking-wide">{result.noResi}</span>
                        <CopyResi resi={result.noResi} />
                      </div>
                    </>
                  ) : (
                    <p className="text-xs text-gray-500 m-0">Kami kabari via email begitu paket diserahkan ke ekspedisi.</p>
                  )}
                </div>
              </li>
            </ol>

            {shipped && (
              <div className="px-4 sm:px-5 pb-4">
                <a href={courierUrl(eksp, result.noResi)} target="_blank" rel="noreferrer" className="block text-center bg-gray-900 hover:bg-black text-white text-sm font-bold py-2.5 rounded-lg no-underline transition-colors">
                  Lihat posisi paket di {eksp} →
                </a>
                <p className="text-[11px] text-gray-400 text-center mt-2 m-0">Situs kurir mungkin meminta beberapa digit terakhir No HP-mu untuk verifikasi.</p>
              </div>
            )}
          </div>
        )}

        <p className="text-xs text-gray-400 text-center mt-6 m-0">
          Butuh bantuan? WhatsApp admin <a href="https://wa.me/6282111311131" className="text-gray-600 underline">0821-1131-1131</a>
        </p>
      </div>
    </div>
  );
}
