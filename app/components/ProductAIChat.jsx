import { useState, useEffect, useRef } from 'react';

function getSessionId() {
  let id = localStorage.getItem('galaxy_session_id');
  if (!id) {
    id = Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem('galaxy_session_id', id);
  }
  return id;
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-3 py-2.5 bg-gray-100 rounded-2xl rounded-tl-sm w-fit">
      {[0, 1, 2].map(i => (
        <span
          key={i}
          className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  );
}

const WA_NUMBER = '6281113111131';
const PHONE_RE = /(\b0821[-\s]?1131[-\s]?1131\b)/g;

function renderWithWaLink(text) {
  const parts = text.split(PHONE_RE);
  return parts.map((part, i) =>
    PHONE_RE.test(part) ? (
      <a
        key={i}
        href={`https://wa.me/${WA_NUMBER}`}
        target="_blank"
        rel="noopener noreferrer"
        className="font-semibold underline underline-offset-2 text-rose-600 hover:text-rose-700"
        onClick={e => e.stopPropagation()}
      >
        {part}
      </a>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

function ChatMessage({ msg }) {
  const isUser = msg.role === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] px-3 py-2.5 text-sm leading-relaxed rounded-2xl ${
          isUser
            ? 'bg-rose-600 text-white rounded-tr-sm'
            : 'bg-gray-100 text-gray-800 rounded-tl-sm'
        }`}
      >
        {isUser ? msg.text : renderWithWaLink(msg.text)}
      </div>
    </div>
  );
}

export function ProductAIChat({ product, selectedVariant }) {
  const [questions, setQuestions] = useState([]);
  const [loadingQuestions, setLoadingQuestions] = useState(true);
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  const handle = product?.handle ?? '';
  const title = product?.title ?? '';
  const price = selectedVariant?.price?.amount
    ? `Rp${Number(parseFloat(selectedVariant.price.amount)).toLocaleString('id-ID')}`
    : '';
  const description = product?.description ?? '';
  // Strip HTML tags from specs metafield (metafields[5])
  const specsRaw = product?.metafields?.[5]?.value ?? '';
  const specs = specsRaw.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const isiBox = product?.metafields?.[2]?.value ?? '';

  // Compute cicilan estimates using same rates as the product page
  const productCicilan = (() => {
    const harga = Number(parseFloat(selectedVariant?.price?.amount ?? 0));
    if (harga < 500000) return '';
    const fmt = (n) => `Rp${Math.ceil(n / 10) * 10 > 0 ? (Math.ceil(n / 10) * 10).toLocaleString('id-ID') : n.toLocaleString('id-ID')}`;

    // Kartu Kredit
    const kk3 = Math.ceil(harga / 3);
    const kk6 = Math.ceil(((harga + harga * 0.015) / 6) / 10) * 10;
    const kk12 = Math.ceil(((harga + harga * 0.035) / 12) / 10) * 10;

    // Kredivo
    const bungaKredivo = harga * 0.026;
    const kr3 = Math.ceil(((harga + harga * 0.03) / 3) / 10) * 10;
    const kr6 = Math.ceil(((harga / 6) + bungaKredivo) / 10) * 10;
    const kr12 = Math.ceil(((harga / 12) + bungaKredivo) / 10) * 10;

    let lines = `Estimasi Cicilan Kartu Kredit:\n3x: ${fmt(kk3)}/bln | 6x: ${fmt(kk6)}/bln | 12x: ${fmt(kk12)}/bln\n\nEstimasi Cicilan Tanpa KK (Kredivo, DP 0%):\n3x: ${fmt(kr3)}/bln | 6x: ${fmt(kr6)}/bln | 12x: ${fmt(kr12)}/bln`;

    if (harga >= 1000000) {
      const bungaHci = harga * 0.032;
      const hci6 = Math.ceil(((harga / 6) + bungaHci) / 10) * 10;
      const hci9 = Math.ceil(((harga / 9) + bungaHci) / 10) * 10;
      const hci12 = Math.ceil(((harga / 12) + bungaHci) / 10) * 10;
      const hci15 = Math.ceil(((harga / 15) + bungaHci) / 10) * 10;
      const hci18 = Math.ceil(((harga / 18) + bungaHci) / 10) * 10;
      lines += `\n\nEstimasi Cicilan Homecredit (DP 0%, proses ke toko):\n6x: ${fmt(hci6)}/bln | 9x: ${fmt(hci9)}/bln | 12x: ${fmt(hci12)}/bln | 15x: ${fmt(hci15)}/bln | 18x: ${fmt(hci18)}/bln`;
    }
    return lines;
  })();

  // Load questions on mount — skeleton shown for at least 600ms so it's visible even on cache hits
  useEffect(() => {
    if (!handle) return;
    const controller = new AbortController();
    setLoadingQuestions(true);
    const start = Date.now();
    const params = new URLSearchParams({ handle, title, description: description.slice(0, 300) });
    fetch(`/api/ask?${params}`, { signal: controller.signal })
      .then(r => r.json())
      .then(d => { if (d.questions?.length) setQuestions(d.questions); })
      .catch(() => {})
      .finally(() => {
        if (controller.signal.aborted) return;
        const elapsed = Date.now() - start;
        const wait = Math.max(0, 600 - elapsed);
        setTimeout(() => setLoadingQuestions(false), wait);
      });
    return () => controller.abort();
  }, [handle]);

  // Scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Focus input when custom mode opens
  useEffect(() => {
    if (isCustomMode && open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isCustomMode, open]);

  async function askQuestion(question, custom = false) {
    setOpen(true);
    if (custom) setIsCustomMode(true);

    const userMsg = { role: 'user', text: question };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          productTitle: title,
          productPrice: price,
          productDescription: description,
          productSpecs: specs,
          productIsiBox: isiBox,
          productCicilan,
          productHandle: handle,
          sessionId: getSessionId(),
          conversationId,
          messages: messages.map(m => ({ role: m.role, text: m.text })),
          isCustom: custom,
        }),
      });
      const data = await res.json();
      if (data.conversationId) setConversationId(data.conversationId);
      const parts = (data.answer ?? '').split('|||').map(s => s.trim()).filter(Boolean);
      setMessages(prev => [...prev, ...parts.map(text => ({ role: 'ai', text }))]);
    } catch {
      setMessages(prev => [...prev, { role: 'ai', text: 'Maaf ka, ada gangguan. Silakan coba lagi 😊' }]);
    } finally {
      setLoading(false);
    }
  }

  function handleSend() {
    const text = inputText.trim();
    if (!text || loading) return;
    setInputText('');
    askQuestion(text, true);
  }

  function handleClose() {
    setOpen(false);
    setMessages([]);
    setIsCustomMode(false);
    setConversationId(null);
  }

  function openCustomMode() {
    setOpen(true);
    setIsCustomMode(true);
    // Only show welcome message when starting fresh — don't wipe an ongoing conversation
    setMessages(prev => prev.length > 0 ? prev : [{ role: 'ai', text: `Hi ka! Ada yang ingin ditanyakan tentang ${title}? Silakan ketik pertanyaanmu 😊` }]);
  }

  const remainingQuestions = questions.filter(
    q => !messages.some(m => m.role === 'user' && m.text === q)
  );

  return (
    <div className="mt-3">
      {/* Section label */}
      <p className="text-[11px] text-gray-400 font-medium mb-2 uppercase tracking-wide">Tanya AI Galaxy</p>

      {/* Bubble questions */}
      <div className="flex flex-wrap gap-2">
        {loadingQuestions ? (
          // Skeleton
          [1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-7 bg-gray-200 rounded-full animate-pulse" style={{ width: `${[112, 96, 128, 104, 88][i - 1]}px` }} />
          ))
        ) : (
          <>
            {questions.map((q, i) => (
              <button
                key={i}
                onClick={() => askQuestion(q, false)}
                className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs rounded-full transition-colors leading-tight text-left"
              >
                {q}
              </button>
            ))}
            <button
              onClick={openCustomMode}
              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs rounded-full border border-rose-200 transition-colors leading-tight font-medium"
            >
              Tanya Hal Lain →
            </button>
          </>
        )}
      </div>

      {/* Chat panel — bottom sheet on mobile, side panel on desktop */}
      {open && (
        <div className="fixed inset-0 z-[70] flex items-end sm:items-end justify-center sm:justify-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Panel — mb-16 on mobile clears bottom navbar, sm:mb-28 clears WA button, md:mb-52 clears WA button at md position */}
          <div className="relative w-full sm:w-96 bg-white rounded-t-2xl sm:rounded-2xl sm:m-4 mb-16 sm:mb-28 md:mb-52 shadow-2xl flex flex-col overflow-hidden"
            style={{ maxHeight: '75vh' }}
          >
            {/* Handle bar (mobile) */}
            <div className="flex justify-center pt-2.5 pb-1 sm:hidden">
              <div className="w-8 h-1 rounded-full bg-gray-300" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-rose-100 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-rose-600">
                    <path fillRule="evenodd" d="M10 2a8 8 0 1 0 0 16A8 8 0 0 0 10 2ZM7.75 6a.75.75 0 0 1 .75.75v3.5h3.25a.75.75 0 0 1 0 1.5h-4a.75.75 0 0 1-.75-.75v-4.25A.75.75 0 0 1 7.75 6Z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-800 leading-none">Tanya AI Galaxy</p>
                  <p className="text-[10px] text-emerald-500 font-medium mt-0.5">● AI Asisten</p>
                </div>
              </div>
              <button onClick={handleClose} className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 text-gray-500">
                  <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                </svg>
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2.5">
              {messages.length === 0 && !loading && (
                <p className="text-xs text-gray-400 text-center mt-4">Pilih pertanyaan di bawah atau ketik sendiri</p>
              )}

              {messages.map((msg, i) => <ChatMessage key={i} msg={msg} />)}
              {loading && (
                <div className="flex justify-start">
                  <TypingIndicator />
                </div>
              )}

              {/* Follow-up question suggestions (after first answer) */}
              {!loading && messages.length >= 2 && !isCustomMode && remainingQuestions.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {remainingQuestions.slice(0, 3).map((q, i) => (
                    <button
                      key={i}
                      onClick={() => askQuestion(q, false)}
                      className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600 text-[11px] rounded-full transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}

              <div ref={bottomRef} />
            </div>

            {/* Input — always visible so customers can type follow-ups after bubble questions */}
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
      )}
    </div>
  );
}
