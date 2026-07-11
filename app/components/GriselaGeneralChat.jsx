import { useState, useEffect, useRef } from 'react';
import {
  getSessionId,
  trackEvent,
  GriselaAvatar,
  TypingIndicator,
  ChatMessage,
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

  async function ask(text) {
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
          messages: messages.map(m => ({ role: m.role, text: m.text })),
          isCustom: true,
        }),
      });
      const data = await res.json();
      if (data.conversationId) setConversationId(data.conversationId);
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
    if (!text || loading) return;
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
            <GriselaAvatar size="w-8 h-8" />
            <div>
              <p className="text-xs font-semibold text-gray-800 leading-none">Grisela</p>
              <p className="text-[10px] text-emerald-500 font-medium mt-0.5">● AI Asisten Galaxy — 24 Jam</p>
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
          {loading && (
            <div className="flex justify-start">
              <TypingIndicator />
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
              placeholder="Ketik pertanyaanmu..."
              className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none"
            />
            <button
              onClick={handleSend}
              disabled={!inputText.trim() || loading}
              className="w-7 h-7 rounded-full bg-rose-600 disabled:bg-gray-200 flex items-center justify-center transition-colors flex-shrink-0"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 text-white">
                <path d="M3.105 2.288a.75.75 0 0 0-.826.95l1.414 4.926A1.5 1.5 0 0 0 5.135 9.25h6.115a.75.75 0 0 1 0 1.5H5.135a1.5 1.5 0 0 0-1.442 1.086l-1.414 4.926a.75.75 0 0 0 .826.95 28.897 28.897 0 0 0 15.293-7.155.75.75 0 0 0 0-1.114A28.897 28.897 0 0 0 3.105 2.288Z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
