import { useState, useEffect, useRef } from 'react';
import { Link } from '@remix-run/react';
import {
  getSessionId,
  trackEvent,
  GriselaAvatar,
  StaffAvatar,
  TypingIndicator,
  ChatMessage,
  listSavedChats,
} from '~/components/ProductAIChat';

const QUICK_QUESTIONS = [
  'Rekomendasi kamera buat pemula',
  'Lagi ada promo apa?',
  'Bisa cicilan tanpa kartu kredit?',
  'Lokasi toko di mana?',
];

/**
 * Standalone Grisela chat (no product context) — used by /bio and the
 * off-hours floating button. `source` is logged to chat_events.
 */
export function GriselaGeneralChat({ open, onClose, source = 'general', waMessage }) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [history, setHistory] = useState([]);
  // Staff live takeover (same flow as ProductAIChat): {name} once a human took over,
  // waitingStaff only if the server ever flags wants_staff (no customer-facing button).
  const [staffMode, setStaffMode] = useState(null);
  const [waitingStaff, setWaitingStaff] = useState(false);
  const serverTotalRef = useRef(null);
  const inFlightRef = useRef(false);
  const appliedIdxRef = useRef(-1); // highest server message index already shown
  useEffect(() => {
    if (!open || !conversationId) return;
    let stopped = false;
    const tick = async () => {
      if (inFlightRef.current) return; // never overlap two polls (a slow network would double-append)
      inFlightRef.current = true;
      try {
        const since = serverTotalRef.current == null ? '' : `&since=${serverTotalRef.current}`;
        const r = await fetch(`/api/chat-sync?conversationId=${encodeURIComponent(conversationId)}${since}`);
        if (!r.ok || stopped) return;
        const d = await r.json();
        serverTotalRef.current = d.total ?? 0;
        setStaffMode(d.mode === 'staff' ? (d.staff || { name: 'Staf Galaxy' }) : null);
        setWaitingStaff(!!d.wantsStaff && d.mode !== 'staff');
        const fresh = (Array.isArray(d.messages) ? d.messages : []).filter((m) => typeof m.i === 'number' && m.i > appliedIdxRef.current);
        if (fresh.length) {
          appliedIdxRef.current = Math.max(...fresh.map((m) => m.i));
          setMessages((prev) => [...prev, ...fresh.map((m) => ({ role: m.role, text: m.text, name: m.name }))]);
        }
      } catch {} finally {
        inFlightRef.current = false;
      }
    };
    tick();
    const id = setInterval(tick, staffMode || waitingStaff ? 3000 : 10000);
    return () => { stopped = true; clearInterval(id); };
  }, [open, conversationId, !!staffMode, waitingStaff]); // eslint-disable-line react-hooks/exhaustive-deps
  // Load the cross-page product-chat history when the panel opens (localStorage only)
  useEffect(() => {
    if (open) setHistory(listSavedChats());
  }, [open]);
  // Silent block: server flags abusive sessions; keep the input disabled through the cooldown
  const [blocked, setBlocked] = useState(false);
  useEffect(() => {
    try {
      const until = parseInt(localStorage.getItem('grisela_blocked_until') || '0', 10);
      if (until && Date.now() < until) setBlocked(true);
    } catch {}
  }, []);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      trackEvent('chat_opened', source, typeof window !== 'undefined' ? window.location.pathname : '');
      setMessages(prev => prev.length > 0 ? prev : [{
        role: 'ai',
        text: 'Hi ka! Aku Grisela, asisten AI Galaxy Camera 😊\nMau cari kamera, tanya harga, cicilan, atau minta rekomendasi? Ketik aja ya!',
      }]);
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  async function ask(text, opts = {}) {
    const q = text.trim();
    if (!q || loading) return;
    setMessages(prev => [...prev, { role: 'user', text: q }]);
    setLoading(true);
    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: q,
          productHandle: source,
          pagePath: typeof window !== 'undefined' ? window.location.pathname : '',
          sessionId: getSessionId(),
          conversationId,
          messages: messages.map(m => ({ role: m.role, text: m.text, ...(m.name ? { name: m.name } : {}) })),
          isCustom: true,
          wantsStaff: !!opts.wantsStaff,
        }),
      });
      const data = await res.json();
      if (data.conversationId) setConversationId(data.conversationId);
      if (data.handoff) {
        setStaffMode(data.staff || { name: 'Staf Galaxy' });
        return;
      }
      if (data.waitingStaff) setWaitingStaff(true);
      if (data.blocked) {
        setBlocked(true);
        try { localStorage.setItem('grisela_blocked_until', String(Date.now() + 45 * 60 * 1000)); } catch {}
      }
      const parts = (data.answer ?? '').split('|||').map(s => s.trim()).filter(Boolean);
      setMessages(prev => [
        ...prev,
        ...parts.map((t, i) => ({
          role: 'ai',
          text: t,
          products: i === parts.length - 1 ? data.products ?? null : null,
          vouchers: i === parts.length - 1 ? data.vouchers ?? null : null,
          marketplaces: i === parts.length - 1 ? data.marketplaces ?? null : null,
        })),
      ]);
    } catch {
      setMessages(prev => [...prev, { role: 'ai', text: 'Maaf ka, ada gangguan. Coba lagi ya 😊' }]);
    } finally {
      setLoading(false);
    }
  }

  function handleSend() {
    const text = inputText.trim();
    if (!text || loading || blocked) return;
    setInputText('');
    ask(text);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden" style={{ maxHeight: '85vh', minHeight: '60vh' }}>
        {/* Handle bar (mobile) */}
        <div className="flex justify-center pt-2.5 pb-1 sm:hidden">
          <div className="w-8 h-1 rounded-full bg-gray-300" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            {staffMode ? <StaffAvatar name={staffMode.name} size="w-8 h-8" /> : <GriselaAvatar size="w-8 h-8" />}
            <div>
              <p className="text-xs font-semibold text-gray-800 leading-none">{staffMode ? staffMode.name : 'Grisela'}</p>
              <p className="text-[10px] text-emerald-500 font-medium mt-0.5">
                {staffMode ? '● Staf Galaxy · menjawab langsung' : waitingStaff ? '● Memanggil staf Galaxy…' : '● AI Asisten Galaxy — 24 Jam'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 text-gray-500">
              <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
            </svg>
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2.5">
          {messages.map((msg, i) => (
            <ChatMessage
              key={i}
              msg={msg}
              waMessage={waMessage ?? 'Halo admin Galaxy Camera 😊 Saya sudah chat dengan Grisela di website. Mau tanya lebih lanjut ya.'}
            />
          ))}
          {loading && !staffMode && (
            <div className="flex justify-start">
              <TypingIndicator />
            </div>
          )}

          {/* Cross-page history — obrolan produk sebelumnya (from any page). Only at
              the start, so it never interrupts an active conversation. */}
          {!loading && messages.length <= 1 && history.length > 0 && (
            <div className="mt-1">
              <p className="text-[11px] font-semibold text-gray-500 mb-1.5">Lanjutkan obrolan sebelumnya</p>
              <div className="flex flex-col gap-1.5">
                {history.slice(0, 5).map((h) => (
                  <Link
                    key={h.handle}
                    to={`/products/${h.handle}`}
                    onClick={onClose}
                    prefetch="intent"
                    className="flex items-center gap-2.5 p-2 rounded-xl border border-gray-100 hover:border-rose-200 hover:bg-rose-50/40 transition-colors no-underline"
                  >
                    {h.image ? (
                      <img src={h.image} alt="" className="w-9 h-9 rounded-lg object-contain bg-gray-50 flex-shrink-0" />
                    ) : (
                      <div className="w-9 h-9 rounded-lg bg-gray-100 flex-shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-semibold text-gray-700 leading-tight line-clamp-1">{h.title || 'Produk'}</p>
                      {h.lastMessage && (
                        <p className="text-[10px] text-gray-400 leading-tight line-clamp-1">{h.lastMessage}</p>
                      )}
                    </div>
                    <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 text-gray-300 flex-shrink-0">
                      <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 0 1 .02-1.06L11.168 10 7.23 6.29a.75.75 0 1 1 1.04-1.08l4.5 4.25a.75.75 0 0 1 0 1.08l-4.5 4.25a.75.75 0 0 1-1.06-.02Z" clipRule="evenodd" />
                    </svg>
                  </Link>
                ))}
              </div>
              <div className="border-t border-gray-100 mt-3 mb-1" />
            </div>
          )}

          {/* Quick questions — only at the start */}
          {!loading && messages.length <= 1 && (
            <div className="flex flex-wrap gap-1.5 mt-1">
              {QUICK_QUESTIONS.map((q, i) => (
                <button
                  key={i}
                  onClick={() => { trackEvent('question_clicked', source, q); ask(q); }}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs rounded-full transition-colors leading-tight text-left"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="px-4 py-3 border-t border-gray-100">
          <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder={blocked ? 'Chat tidak tersedia' : 'Ketik pertanyaanmu...'}
              disabled={blocked}
              className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none disabled:cursor-not-allowed"
            />
            <button
              onClick={handleSend}
              disabled={!inputText.trim() || loading || blocked}
              className="w-7 h-7 rounded-full bg-rose-600 disabled:bg-gray-200 flex items-center justify-center transition-colors flex-shrink-0"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 text-white">
                <path d="M3.105 2.288a.75.75 0 0 0-.826.95l1.414 4.926A1.5 1.5 0 0 0 5.135 9.25h6.115a.75.75 0 0 1 0 1.5H5.135a1.5 1.5 0 0 0-1.442 1.086l-1.414 4.926a.75.75 0 0 0 .826.95 28.897 28.897 0 0 0 15.293-7.155.75.75 0 0 0 0-1.114A28.897 28.897 0 0 0 3.105 2.288Z" />
              </svg>
            </button>
          </div>
          <p className="text-[9px] text-gray-300 text-center mt-1.5 leading-tight">
            {staffMode ? `Kamu sedang chat langsung dengan ${staffMode.name}, staf Galaxy` : 'Grisela AI bisa keliru — cek info penting ke admin ya'}
          </p>
        </div>
      </div>
    </div>
  );
}
