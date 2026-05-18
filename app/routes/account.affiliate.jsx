import { json, redirect } from '@shopify/remix-oxygen';
import { useLoaderData, useFetcher, useOutletContext } from '@remix-run/react';
import { useState, useEffect } from 'react';

const FIRESTORE_KEY = 'AIzaSyAfREwK-3UbL1x7jeeR6L3McIsAROvZ5hU';
const FIRESTORE_BASE = 'https://firestore.googleapis.com/v1/projects/galaxypwa/databases/(default)/documents';

const CUSTOMER_QUERY = `#graphql
  query GetCustomer($token: String!) {
    customer(customerAccessToken: $token) { email firstName lastName }
  }
`;

export const meta = () => [{ title: 'Program Affiliate | Galaxy Camera' }];

async function getAffiliateByEmail(email) {
  const res = await fetch(`${FIRESTORE_BASE}:runQuery?key=${FIRESTORE_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      structuredQuery: {
        from: [{ collectionId: 'affiliates' }],
        where: { fieldFilter: { field: { fieldPath: 'email' }, op: 'EQUAL', value: { stringValue: email } } },
        limit: 1,
      },
    }),
  });
  const rows = await res.json();
  const doc = rows?.[0]?.document;
  if (!doc) return null;
  const f = doc.fields || {};
  return {
    refCode: f.refCode?.stringValue || '',
    name: f.name?.stringValue || '',
    namaBank: f.namaBank?.stringValue || '',
    nomorRekening: f.nomorRekening?.stringValue || '',
    atasNama: f.atasNama?.stringValue || '',
    promoMethod: f.promoMethod?.stringValue || '',
    status: f.status?.stringValue || 'pending',
    totalClicks: parseInt(f.totalClicks?.integerValue || 0),
    totalOrders: parseInt(f.totalOrders?.integerValue || 0),
    totalEarned: parseInt(f.totalEarned?.integerValue || 0),
    totalPaid: parseInt(f.totalPaid?.integerValue || 0),
    createdAt: f.createdAt?.stringValue || '',
  };
}

export async function loader({ context }) {
  const { session, storefront } = context;
  const customerAccessToken = await session.get('customerAccessToken');
  if (!customerAccessToken?.accessToken) return redirect('/account/login');

  const { customer } = await storefront.query(CUSTOMER_QUERY, {
    variables: { token: customerAccessToken.accessToken },
    cache: storefront.CacheNone(),
  }).catch(() => ({ customer: null }));

  if (!customer) return redirect('/account/login');

  const [affiliate, configRes] = await Promise.all([
    getAffiliateByEmail(customer.email),
    fetch(`${FIRESTORE_BASE}/affiliate_config/settings?key=${FIRESTORE_KEY}`).catch(() => null),
  ]);

  // Parse commission rates config — supports new dynamic map schema and old fixed fields
  let rates = {};
  let rateDefault = 2;
  if (configRes?.ok) {
    const cf = (await configRes.json()).fields || {};
    rateDefault = parseFloat(cf.rateDefault?.doubleValue || cf.rateDefault?.integerValue || 2);
    if (cf.rates?.mapValue?.fields) {
      for (const [k, v] of Object.entries(cf.rates.mapValue.fields)) {
        rates[k] = parseFloat(v.doubleValue || v.integerValue || 0);
      }
    } else {
      rates = {
        Kamera: parseFloat(cf.rateKamera?.doubleValue || cf.rateKamera?.integerValue || 2),
        Lensa: parseFloat(cf.rateLensa?.doubleValue || cf.rateLensa?.integerValue || 2.5),
        Aksesoris: parseFloat(cf.rateAksesoris?.doubleValue || cf.rateAksesoris?.integerValue || 4),
        Bundle: parseFloat(cf.rateBundle?.doubleValue || cf.rateBundle?.integerValue || 3),
      };
    }
  }

  // Fetch commissions if registered (show empty history for pending too)
  let commissions = [];
  if (affiliate) {
    const comRes = await fetch(`${FIRESTORE_BASE}:runQuery?key=${FIRESTORE_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        structuredQuery: {
          from: [{ collectionId: 'affiliate_commissions' }],
          where: { fieldFilter: { field: { fieldPath: 'refCode' }, op: 'EQUAL', value: { stringValue: affiliate.refCode } } },
          orderBy: [{ field: { fieldPath: 'createdAt' }, direction: 'DESCENDING' }],
          limit: 20,
        },
      }),
    }).catch(() => null);

    if (comRes?.ok) {
      const rows = await comRes.json();
      commissions = (rows || [])
        .filter(r => r.document)
        .map(r => {
          const f = r.document.fields || {};
          return {
            orderId: f.orderId?.stringValue || '',
            orderNumber: parseInt(f.orderNumber?.integerValue || 0),
            orderTotal: parseFloat(f.orderTotal?.doubleValue || f.orderTotal?.integerValue || 0),
            commissionAmount: parseInt(f.commissionAmount?.integerValue || 0),
            status: f.status?.stringValue || 'pending',
            createdAt: f.createdAt?.stringValue || '',
          };
        });
    }

    // Sync to localStorage so product page can show copy button
    // (done client-side in useEffect)
  }

  return json({ affiliate, commissions, rates, rateDefault, email: customer.email });
}

export async function action({ request, context }) {
  const { session, storefront } = context;
  const customerAccessToken = await session.get('customerAccessToken');
  if (!customerAccessToken?.accessToken) return json({ error: 'Unauthorized' }, { status: 401 });

  const formData = await request.formData();
  const intent = formData.get('intent');

  if (intent === 'register') {
    const registerRes = await fetch(new URL('/api/affiliate-register', request.url), {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', cookie: request.headers.get('cookie') || '' },
      body: new URLSearchParams({
        name: formData.get('name') || '',
        namaBank: formData.get('namaBank') || '',
        nomorRekening: formData.get('nomorRekening') || '',
        atasNama: formData.get('atasNama') || '',
        promoMethod: formData.get('promoMethod') || '',
      }),
    });
    const data = await registerRes.json();
    if (data.error) return json({ error: data.error });
    return json({ ok: true });
  }

  return json({ error: 'Unknown intent' }, { status: 400 });
}

function fmt(num) {
  return new Intl.NumberFormat('id-ID').format(num);
}

function StatusBadge({ status }) {
  const map = {
    pending: { label: 'Menunggu Persetujuan', cls: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
    approved: { label: 'Aktif', cls: 'bg-green-100 text-green-700 border-green-200' },
    suspended: { label: 'Ditangguhkan', cls: 'bg-red-100 text-red-700 border-red-200' },
  };
  const s = map[status] || map.pending;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${s.cls}`}>
      {s.label}
    </span>
  );
}

function DashboardTeaser() {
  const fakeStats = [
    { icon: '👆', label: 'Total Klik', value: '248' },
    { icon: '🛒', label: 'Total Order', value: '12' },
    { icon: '💰', label: 'Total Komisi', value: 'Rp 384.000' },
    { icon: '✅', label: 'Sudah Dibayar', value: 'Rp 240.000' },
  ];

  return (
    <div className="relative">
      {/* Blurred fake dashboard */}
      <div className="blur-sm pointer-events-none select-none space-y-3">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {fakeStats.map(s => (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 sm:p-4">
              <div className="text-xl sm:text-2xl mb-1">{s.icon}</div>
              <div className="text-sm sm:text-base font-black text-gray-900 leading-tight">{s.value}</div>
              <div className="text-[11px] text-gray-500 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="h-3 bg-gray-100 rounded-full w-1/3 mb-4" />
          <div className="flex items-center gap-2">
            <div className="flex-1 h-10 bg-gray-50 rounded-xl border border-dashed border-gray-200" />
            <div className="w-24 h-10 bg-gray-900 rounded-xl" />
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <div className="h-3 bg-gray-100 rounded-full w-1/4" />
          </div>
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center justify-between px-5 py-3.5 border-b border-gray-50 last:border-0">
              <div className="space-y-1.5">
                <div className="h-3 bg-gray-100 rounded-full w-24" />
                <div className="h-2.5 bg-gray-50 rounded-full w-36" />
              </div>
              <div className="space-y-1.5 items-end flex flex-col">
                <div className="h-3 bg-gray-100 rounded-full w-20" />
                <div className="h-2.5 bg-green-50 rounded-full w-16" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Overlay CTA */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="bg-white/90 backdrop-blur-sm border border-gray-200 rounded-2xl px-6 py-5 text-center shadow-lg mx-4">
          <div className="text-2xl mb-2">🔒</div>
          <p className="text-sm font-bold text-gray-900">Dashboard Affiliate</p>
          <p className="text-xs text-gray-500 mt-1 mb-3 leading-relaxed">
            Daftar untuk mulai melacak klik, order,<br className="hidden sm:block" /> dan komisi kamu secara real-time
          </p>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
              <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
            </svg>
            Isi form di bawah untuk membuka akses
          </div>
        </div>
      </div>
    </div>
  );
}

function RegisterForm({ fetcher, rates, rateDefault }) {
  const allRateValues = [...Object.values(rates), rateDefault].filter(v => v > 0);
  const maxRate = allRateValues.length > 0 ? Math.max(...allRateValues) : rateDefault;
  const rateEntries = Object.entries(rates);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex flex-col sm:flex-row">

        {/* Left — dark info panel */}
        <div className="sm:w-64 bg-gray-900 text-white p-6 sm:p-8 flex flex-col gap-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">Program Affiliate</p>
            <h2 className="text-xl font-black leading-snug">Hasilkan uang dari rekomendasi kamu</h2>
            <p className="text-sm text-gray-400 mt-2">
              Bagikan link produk, dapatkan komisi hingga <span className="text-yellow-400 font-bold">{maxRate}%</span> setiap ada pembelian.
            </p>
          </div>

          {/* Commission rates — dynamic from Shopify product types */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Komisi per kategori</p>
            {rateEntries.length > 0 ? (
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {rateEntries.map(([type, rate]) => (
                  <div key={type} className="flex items-center justify-between">
                    <span className="text-sm text-gray-300 truncate pr-2">{type}</span>
                    <span className="text-sm font-black text-yellow-400 flex-shrink-0">{rate}%</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-500">Hingga {maxRate}% per penjualan</p>
            )}
            <div className="flex items-center justify-between border-t border-gray-700/50 pt-2 mt-1">
              <span className="text-sm text-gray-500">Lainnya</span>
              <span className="text-sm font-black text-yellow-400">{rateDefault}%</span>
            </div>
          </div>

          {/* How it works */}
          <div className="space-y-3 mt-auto">
            {[
              { step: '1', text: 'Daftar & tunggu persetujuan' },
              { step: '2', text: 'Salin link referral kamu' },
              { step: '3', text: 'Bagikan ke followers / teman' },
              { step: '4', text: 'Komisi masuk otomatis' },
            ].map(s => (
              <div key={s.step} className="flex items-start gap-3">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-gray-700 text-gray-300 text-[10px] font-bold flex items-center justify-center mt-0.5">{s.step}</span>
                <span className="text-xs text-gray-400 leading-relaxed">{s.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right — form */}
        <div className="flex-1 p-6 sm:p-8">
          <h3 className="text-base font-bold text-gray-900 mb-5">Isi Data Pendaftaran</h3>
          <fetcher.Form method="POST">
            <input type="hidden" name="intent" value="register" />
            <div className="space-y-5">

              {/* Nama Lengkap */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nama Lengkap</label>
                <input
                  name="name" required
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  placeholder="Nama lengkap kamu"
                />
              </div>

              {/* Info Rekening — 3 field terpisah */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Info Rekening Pembayaran Komisi
                </label>
                <div className="rounded-xl border border-gray-200 overflow-hidden divide-y divide-gray-100">
                  {[
                    { name: 'namaBank', label: 'Nama Bank', placeholder: 'BCA, BRI, Mandiri, GoPay, OVO...', inputMode: 'text', mono: false },
                    { name: 'nomorRekening', label: 'No. Rekening', placeholder: '1234567890', inputMode: 'numeric', mono: true },
                    { name: 'atasNama', label: 'Atas Nama', placeholder: 'Nama sesuai rekening', inputMode: 'text', mono: false },
                  ].map(f => (
                    <div key={f.name} className="flex items-center">
                      <span className="flex-shrink-0 w-24 sm:w-28 px-3 sm:px-4 py-2.5 text-xs sm:text-sm text-gray-500 bg-gray-50 border-r border-gray-200 leading-tight">
                        {f.label}
                      </span>
                      <input
                        name={f.name} required
                        inputMode={f.inputMode}
                        className={`flex-1 min-w-0 px-3 sm:px-4 py-2.5 text-sm focus:outline-none focus:bg-blue-50/40 ${f.mono ? 'font-mono' : ''}`}
                        placeholder={f.placeholder}
                      />
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-gray-400 mt-1.5 ml-1">Komisi akan ditransfer ke rekening ini setelah disetujui</p>
              </div>

              {/* Cara Promosi */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Cara Promosi <span className="font-normal text-gray-400">(opsional)</span>
                </label>
                <input
                  name="promoMethod"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  placeholder="Contoh: Instagram, YouTube, TikTok, Blog"
                />
              </div>

              {fetcher.data?.error && (
                <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{fetcher.data.error}</p>
              )}

              <button
                type="submit"
                disabled={fetcher.state !== 'idle'}
                className="w-full bg-gray-900 hover:bg-gray-800 text-white font-semibold py-3 rounded-xl text-sm transition-colors disabled:opacity-50"
              >
                {fetcher.state !== 'idle' ? 'Mendaftarkan...' : 'Daftar Sekarang'}
              </button>
              <p className="text-[11px] text-gray-400 text-center">
                Pendaftaran akan direview admin dalam 1–2 hari kerja
              </p>
            </div>
          </fetcher.Form>
        </div>

      </div>
    </div>
  );
}

function AffiliateDashboard({ affiliate, commissions }) {
  const isPending = affiliate.status === 'pending';
  const [copied, setCopied] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [generatedLink, setGeneratedLink] = useState('');
  const baseLink = typeof window !== 'undefined' ? `${window.location.origin}?ref=${affiliate.refCode}` : '';

  useEffect(() => {
    if (!isPending && typeof window !== 'undefined') {
      localStorage.setItem('galaxy_aff_code', affiliate.refCode);
      localStorage.setItem('galaxy_aff_status', 'approved');
    }
  }, [affiliate.refCode, isPending]);

  function copyBaseLink() {
    if (isPending) return;
    navigator.clipboard.writeText(baseLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function generateLink() {
    if (isPending || !linkUrl) return;
    try {
      const url = new URL(linkUrl.startsWith('http') ? linkUrl : `https://${linkUrl}`);
      url.searchParams.set('ref', affiliate.refCode);
      setGeneratedLink(url.toString());
    } catch {
      setGeneratedLink('');
    }
  }

  const pendingEarned = commissions
    .filter(c => c.status === 'pending')
    .reduce((s, c) => s + c.commissionAmount, 0);

  const statusColor = { pending: 'text-yellow-600 bg-yellow-50', approved: 'text-green-600 bg-green-50', paid: 'text-blue-600 bg-blue-50' };
  const statusLabel = { pending: 'Pending', approved: 'Siap Dicairkan', paid: 'Sudah Dibayar' };

  return (
    <div className="space-y-4">

      {/* Pending review banner */}
      {isPending && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-4">
          <div className="flex-shrink-0 w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center mt-0.5">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-amber-600">
              <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 6a.75.75 0 00-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 000-1.5h-3.75V6z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-bold text-amber-800">Pendaftaran sedang direview</p>
            <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
              Tim kami akan memverifikasi dalam 1–2 hari kerja. Semua fitur di bawah akan aktif setelah disetujui — ini tampilan dashboard kamu nanti.
            </p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Klik', value: affiliate.totalClicks.toLocaleString('id-ID'), icon: '👆' },
          { label: 'Total Order', value: affiliate.totalOrders.toLocaleString('id-ID'), icon: '🛒' },
          { label: 'Total Komisi', value: `Rp ${fmt(affiliate.totalEarned)}`, icon: '💰' },
          { label: 'Sudah Dibayar', value: `Rp ${fmt(affiliate.totalPaid)}`, icon: '✅' },
        ].map(s => (
          <div key={s.label} className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-3 sm:p-4 ${isPending ? 'opacity-50' : ''}`}>
            <div className="text-xl sm:text-2xl mb-1">{s.icon}</div>
            <div className="text-sm sm:text-base font-black text-gray-900 leading-tight break-all">{s.value}</div>
            <div className="text-[11px] text-gray-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Pending balance CTA — only when approved */}
      {!isPending && pendingEarned > 0 && (
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-4 text-white flex items-center justify-between gap-3 flex-wrap">
          <div>
            <p className="text-sm font-semibold opacity-90">Komisi siap dicairkan</p>
            <p className="text-xl font-black">Rp {fmt(pendingEarned)}</p>
          </div>
          <a href="https://wa.me/6281234567890" target="_blank" rel="noreferrer"
            className="flex-shrink-0 bg-white text-green-700 font-bold text-sm px-4 py-2 rounded-xl hover:bg-green-50 transition-colors">
            Cairkan
          </a>
        </div>
      )}

      {/* Ref code + copy */}
      <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-5 ${isPending ? 'opacity-60' : ''}`}>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Kode Referral Kamu</p>
        {isPending ? (
          <div className="flex items-center gap-2 mb-3">
            <span className="flex-1 min-w-0 font-mono font-black text-sm sm:text-lg text-gray-300 bg-gray-50 border border-dashed border-gray-200 px-3 sm:px-4 py-2 rounded-xl select-none tracking-widest">
              ••••••••
            </span>
            <span className="flex-shrink-0 flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl font-semibold text-sm text-gray-400 bg-gray-100 whitespace-nowrap cursor-not-allowed">
              🔒 Terkunci
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 mb-4">
            <span className="flex-1 min-w-0 font-mono font-black text-sm sm:text-lg tracking-wider sm:tracking-widest text-gray-900 bg-gray-50 border border-dashed border-gray-300 px-3 sm:px-4 py-2 rounded-xl truncate">
              {affiliate.refCode}
            </span>
            <button onClick={copyBaseLink}
              className="flex-shrink-0 flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl font-semibold text-sm text-white transition-all duration-200 active:scale-95 whitespace-nowrap"
              style={{ background: copied ? '#059669' : '#111827' }}>
              {copied ? '✓ Disalin' : 'Salin Link'}
            </button>
          </div>
        )}
        {!isPending && <p className="text-xs text-gray-400 break-all">{baseLink}</p>}
        {isPending && (
          <p className="text-xs text-amber-600">Kode referral akan aktif setelah pendaftaran disetujui</p>
        )}
      </div>

      {/* Link generator */}
      <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-5 ${isPending ? 'opacity-60' : ''}`}>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Generator Link Produk</p>
        <div className="flex gap-2">
          <input
            type="text"
            value={linkUrl}
            onChange={e => !isPending && setLinkUrl(e.target.value)}
            placeholder={isPending ? 'Aktif setelah disetujui...' : 'Paste URL produk di sini...'}
            disabled={isPending}
            className={`flex-1 min-w-0 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none ${isPending ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : 'focus:ring-2 focus:ring-gray-900'}`}
          />
          <button onClick={generateLink} disabled={isPending}
            className={`flex-shrink-0 font-semibold px-3 sm:px-4 py-2 rounded-xl text-sm whitespace-nowrap transition-colors ${isPending ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-900 text-white hover:bg-gray-800'}`}>
            Buat
          </button>
        </div>
        {generatedLink && (
          <div className="mt-3 bg-gray-50 rounded-xl p-3">
            <p className="text-xs text-gray-500 mb-1.5">Link affiliate kamu:</p>
            <p className="text-xs font-mono text-gray-800 break-all mb-2">{generatedLink}</p>
            <button
              onClick={() => navigator.clipboard.writeText(generatedLink)}
              className="text-xs font-semibold text-gray-900 bg-white border border-gray-200 px-3 py-1 rounded-lg hover:bg-gray-50">
              Salin
            </button>
          </div>
        )}
      </div>

      {/* Commission history */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <p className="text-sm font-bold text-gray-900">Riwayat Komisi</p>
        </div>
        {commissions.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <div className="text-3xl mb-3">💰</div>
            {isPending ? (
              <>
                <p className="text-sm font-semibold text-gray-700">Komisi kamu akan muncul di sini</p>
                <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto leading-relaxed">
                  Setiap kali ada pembelian melalui link kamu, komisi langsung masuk dan bisa kamu cairkan
                </p>
              </>
            ) : (
              <>
                <p className="text-sm font-semibold text-gray-700">Belum ada komisi</p>
                <p className="text-xs text-gray-400 mt-1">Mulai bagikan link referral kamu!</p>
              </>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {commissions.map((c, i) => (
              <div key={i} className="flex items-center justify-between px-4 sm:px-5 py-3.5 gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-800">Order #{c.orderNumber}</p>
                  <p className="text-xs text-gray-400 mt-0.5 truncate">
                    {new Date(c.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    {' · '}Rp {fmt(c.orderTotal)}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-black text-gray-900">+Rp {fmt(c.commissionAmount)}</p>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusColor[c.status] || 'text-gray-500 bg-gray-100'}`}>
                    {statusLabel[c.status] || c.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Account info */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Info Akun Affiliate</p>
        <div className="space-y-2 text-sm">
          {[
            { label: 'Nama', value: affiliate.name, mono: false },
            { label: 'Nama Bank', value: affiliate.namaBank || '—', mono: false },
            { label: 'No. Rekening', value: affiliate.nomorRekening || '—', mono: true },
            { label: 'Atas Nama', value: affiliate.atasNama || '—', mono: false },
          ].map(row => (
            <div key={row.label} className="flex items-start justify-between gap-3">
              <span className="text-gray-500 flex-shrink-0">{row.label}</span>
              <span className={`font-semibold text-gray-800 text-right break-words min-w-0 ${row.mono ? 'font-mono' : ''}`}>{row.value}</span>
            </div>
          ))}
          <div className="flex items-center justify-between gap-3">
            <span className="text-gray-500 flex-shrink-0">Status</span>
            <StatusBadge status={affiliate.status} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AffiliatePage() {
  const { affiliate, commissions, rates, rateDefault } = useLoaderData();
  const fetcher = useFetcher();

  // After successful registration, reload
  const registered = fetcher.data?.ok;

  if (registered) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-green-600">
            <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-gray-900 mb-2">Pendaftaran Berhasil!</h2>
        <p className="text-sm text-gray-500">Pendaftaran kamu sedang direview. Refresh halaman untuk melihat status.</p>
        <button onClick={() => window.location.reload()}
          className="mt-4 bg-gray-900 text-white text-sm font-semibold px-6 py-2.5 rounded-xl hover:bg-gray-800 transition-colors">
          Refresh
        </button>
      </div>
    );
  }

  if (!affiliate) return (
    <div className="space-y-4">
      <DashboardTeaser />
      <RegisterForm fetcher={fetcher} rates={rates} rateDefault={rateDefault} />
    </div>
  );
  return <AffiliateDashboard affiliate={affiliate} commissions={commissions} />;
}
