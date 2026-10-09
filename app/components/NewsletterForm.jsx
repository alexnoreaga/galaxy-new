import {useState} from 'react';

// Promo / flash-sale email opt-in → /api/newsletter → Shopify customer marketing consent.
// `tone="dark"` for the charcoal footer, default light for content pages.
export function NewsletterForm({source = 'footer', tone = 'light', title, subtitle, compact = false}) {
  const [email, setEmail] = useState('');
  const [state, setState] = useState('idle'); // idle | busy | done | already | error
  const [msg, setMsg] = useState('');
  const dark = tone === 'dark';
  const submit = async (e) => {
    e.preventDefault();
    if (state === 'busy') return;
    setState('busy'); setMsg('');
    try {
      const r = await fetch('/api/newsletter', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({email, source, website: e.currentTarget?.website?.value || ''})});
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j?.error || 'Gagal mendaftar');
      setState(j.status === 'already' ? 'already' : 'done');
      try { window.gtag?.('event', 'newsletter_signup', {source, status: j.status}); } catch {}
    } catch (err) {
      setState('error'); setMsg(err?.message || 'Gagal mendaftar, coba lagi');
    }
  };
  const inp = dark
    ? 'bg-white/10 border-white/15 text-white placeholder:text-gray-500 focus:border-white/40'
    : 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-gray-900';
  const btn = dark ? 'bg-white text-gray-900 hover:bg-gray-100' : 'bg-gray-900 text-white hover:bg-gray-800';
  if (state === 'done' || state === 'already') {
    return (
      <p className={`text-sm ${dark ? 'text-emerald-300' : 'text-emerald-700'}`}>
        {state === 'done' ? '✓ Terdaftar. Flash sale dan promo berikutnya akan dikirim ke email kamu.' : '✓ Email ini sudah terdaftar untuk info promo.'}
      </p>
    );
  }
  return (
    <form onSubmit={submit} className={compact ? '' : 'max-w-md'}>
      {title && <p className={`text-sm font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>{title}</p>}
      {subtitle && <p className={`text-xs mt-1 mb-3 ${dark ? 'text-gray-400' : 'text-gray-500'}`}>{subtitle}</p>}
      {/* honeypot — bots fill it, humans never see it */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
      <div className="flex gap-2">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Alamat email kamu"
          aria-label="Alamat email"
          className={`min-w-0 flex-1 rounded-xl border px-3 py-2.5 text-sm focus:outline-none ${inp}`}
        />
        <button type="submit" disabled={state === 'busy'} className={`shrink-0 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors disabled:opacity-60 ${btn}`}>
          {state === 'busy' ? '…' : 'Daftar'}
        </button>
      </div>
      {state === 'error' && <p className="mt-2 text-xs text-red-500">{msg}</p>}
      <p className={`mt-2 text-[11px] ${dark ? 'text-gray-500' : 'text-gray-400'}`}>Hanya info promo dan flash sale. Berhenti kapan saja lewat tautan di email.</p>
    </form>
  );
}
