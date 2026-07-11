import { useState, useEffect, useRef } from 'react';

export function getSessionId() {
  let id = localStorage.getItem('galaxy_session_id');
  if (!id) {
    id = Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem('galaxy_session_id', id);
  }
  return id;
}

const AVATAR = '/Grisela.png';

export function GriselaAvatar({ size = 'w-6 h-6' }) {
  return (
    <img
      src={AVATAR}
      alt="Grisela"
      className={`${size} rounded-full object-cover flex-shrink-0 select-none`}
      draggable={false}
    />
  );
}

export function TypingIndicator() {
  return (
    <div className="flex items-end gap-1.5">
      <GriselaAvatar />
      <div className="flex items-center gap-1 px-3 py-2.5 bg-gray-100 rounded-2xl rounded-tl-sm w-fit">
        {[0, 1, 2].map(i => (
          <span
            key={i}
            className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  );
}

export function trackEvent(type, handle = '', meta = '') {
  try {
    fetch('/api/chat-event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, handle, sessionId: getSessionId(), meta }),
      keepalive: true,
    }).catch(() => {});
  } catch {
    // analytics must never break the chat
  }
}

const WA_NUMBER = '6282111311131';
// Split on phone number OR http(s) URLs so both become clickable
const LINK_SPLIT_RE = /(0821[-\s]?1131[-\s]?1131|https?:\/\/[^\s]+)/g;

function renderWithWaLink(text, waMessage) {
  const waHref = `https://wa.me/${WA_NUMBER}${waMessage ? `?text=${encodeURIComponent(waMessage)}` : ''}`;
  const parts = text.split(LINK_SPLIT_RE);
  return parts.map((part, i) => {
    if (/^0821[-\s]?1131[-\s]?1131$/.test(part)) {
      return (
        <a
          key={i}
          href={waHref}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold underline underline-offset-2 text-rose-600 hover:text-rose-700"
          onClick={e => { e.stopPropagation(); trackEvent('wa_clicked'); }}
        >
          {part}
        </a>
      );
    }
    if (/^https?:\/\//.test(part)) {
      const url = part.replace(/[.,!?)]+$/, ''); // strip trailing punctuation
      const trail = part.slice(url.length);
      return (
        <span key={i}>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold underline underline-offset-2 text-rose-600 hover:text-rose-700 break-all"
            onClick={e => e.stopPropagation()}
          >
            {url.replace(/^https?:\/\/(www\.)?/, '')}
          </a>
          {trail}
        </span>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

function ProductCard({ product }) {
  const img = product.image
    ? `${product.image}${product.image.includes('?') ? '&' : '?'}width=120`
    : null;
  return (
    <a
      href={`/products/${product.handle}`}
      onClick={() => trackEvent('product_card_clicked', product.handle)}
      className="flex items-center gap-3 bg-white border border-gray-200 hover:border-rose-300 rounded-xl p-2 transition-colors group"
    >
      {img ? (
        <img
          src={img}
          alt={product.title}
          loading="lazy"
          className="w-14 h-14 rounded-lg object-cover flex-shrink-0 bg-gray-50"
        />
      ) : (
        <div className="w-14 h-14 rounded-lg bg-gray-100 flex-shrink-0 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-gray-300">
            <path d="M12 9a3.75 3.75 0 1 0 0 7.5A3.75 3.75 0 0 0 12 9Z" />
            <path fillRule="evenodd" d="M9.344 3.071a49.52 49.52 0 0 1 5.312 0c.967.052 1.83.585 2.332 1.39l.821 1.317c.24.383.645.643 1.11.71.386.054.77.113 1.152.177 1.432.239 2.429 1.493 2.429 2.909V18a3 3 0 0 1-3 3h-15a3 3 0 0 1-3-3V9.574c0-1.416.997-2.67 2.429-2.909.382-.064.766-.123 1.151-.178a1.56 1.56 0 0 0 1.11-.71l.822-1.315a2.942 2.942 0 0 1 2.332-1.39Z" clipRule="evenodd" />
          </svg>
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-gray-800 leading-snug line-clamp-2">{product.title}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-sm font-bold text-rose-600">Rp{Number(product.price).toLocaleString('id-ID')}</span>
          {product.available ? (
            <span className="text-[9px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">Ready</span>
          ) : (
            <span className="text-[9px] font-semibold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">Habis</span>
          )}
        </div>
      </div>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-gray-300 group-hover:text-rose-500 flex-shrink-0 transition-colors">
        <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 0 1 .02-1.06L11.168 10 7.23 6.29a.75.75 0 1 1 1.04-1.08l4.5 4.25a.75.75 0 0 1 0 1.08l-4.5 4.25a.75.75 0 0 1-1.06-.02Z" clipRule="evenodd" />
      </svg>
    </a>
  );
}

function VoucherChatCard({ voucher }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(voucher.code).catch(() => {});
    trackEvent('voucher_copied', '', voucher.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  const discountLabel = voucher.discountType === 'percentage'
    ? `${voucher.discount}%`
    : `Rp${Number(voucher.discount).toLocaleString('id-ID')}`;
  return (
    <div className="flex items-center justify-between gap-2 bg-rose-50/70 border border-dashed border-rose-300 rounded-xl px-3 py-2.5">
      <div className="min-w-0">
        <p className="font-mono text-sm font-bold text-rose-700 tracking-wider">{voucher.code}</p>
        <p className="text-[10px] text-gray-500 truncate">
          Diskon {discountLabel}{voucher.minPurchase ? ` • min. ${voucher.minPurchase}` : ''}
        </p>
      </div>
      <button
        onClick={copy}
        className={`flex-shrink-0 px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all active:scale-95 ${
          copied ? 'bg-emerald-500 text-white' : 'bg-rose-600 hover:bg-rose-700 text-white'
        }`}
      >
        {copied ? '✓ Tersalin' : 'Salin'}
      </button>
    </div>
  );
}

const MARKETPLACE_COLORS = { Tokopedia: '#03ac0e', Shopee: '#ee4d2d', Blibli: '#0095da' };

function MarketplaceLinkRow({ link }) {
  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => trackEvent('marketplace_clicked', '', link.name)}
      className="flex items-center gap-3 bg-white border border-gray-200 hover:border-rose-300 rounded-xl px-3 py-2.5 transition-colors group"
    >
      <span
        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-black flex-shrink-0"
        style={{ backgroundColor: MARKETPLACE_COLORS[link.name] ?? '#6b7280' }}
      >
        {link.name[0]}
      </span>
      <span className="flex-1 text-xs font-semibold text-gray-800">Lihat di {link.name}</span>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-gray-300 group-hover:text-rose-500 flex-shrink-0 transition-colors">
        <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 0 1 .02-1.06L11.168 10 7.23 6.29a.75.75 0 1 1 1.04-1.08l4.5 4.25a.75.75 0 0 1 0 1.08l-4.5 4.25a.75.75 0 0 1-1.06-.02Z" clipRule="evenodd" />
      </svg>
    </a>
  );
}

export function ChatMessage({ msg, waMessage }) {
  const isUser = msg.role === 'user';
  if (isUser) {
    return (
      <div className="flex flex-col items-end">
        <div className="max-w-[85%] px-3 py-2.5 text-sm leading-relaxed rounded-2xl whitespace-pre-line bg-rose-600 text-white rounded-tr-sm">
          {msg.text}
        </div>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-start">
      <div className="flex items-end gap-1.5 max-w-[85%]">
        <GriselaAvatar />
        <div className="px-3 py-2.5 text-sm leading-relaxed rounded-2xl whitespace-pre-line bg-gray-100 text-gray-800 rounded-tl-sm">
          {renderWithWaLink(msg.text, waMessage)}
        </div>
      </div>
      {msg.products?.length > 0 && (
        <div className="flex flex-col gap-1.5 mt-1.5 w-full max-w-[95%] pl-[30px]">
          {msg.products.map(p => <ProductCard key={p.handle} product={p} />)}
        </div>
      )}
      {msg.vouchers?.length > 0 && (
        <div className="flex flex-col gap-1.5 mt-1.5 w-full max-w-[95%] pl-[30px]">
          {msg.vouchers.map(v => <VoucherChatCard key={v.code} voucher={v} />)}
        </div>
      )}
      {msg.marketplaces?.length > 0 && (
        <div className="flex flex-col gap-1.5 mt-1.5 w-full max-w-[95%] pl-[30px]">
          {msg.marketplaces.map(l => <MarketplaceLinkRow key={l.name} link={l} />)}
        </div>
      )}
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
  const freeBonus = product?.metafields?.[1]?.value ?? '';
  const isDiscontinued = product?.metafields?.[12]?.value === 'true';
  const inStock = selectedVariant?.availableForSale ?? true;

  // Nego offer: extra 3% off, computed here so the AI never does math itself
  const negoInfo = (() => {
    const harga = Number(parseFloat(selectedVariant?.price?.amount ?? 0));
    if (!harga) return '';
    const potongan = Math.round(harga * 0.03);
    const hargaNego = Math.floor((harga - potongan) / 1000) * 1000;
    return `Harga normal: Rp${harga.toLocaleString('id-ID')} | Potongan tambahan 3%: Rp${potongan.toLocaleString('id-ID')} | HARGA SPESIAL NEGO: Rp${hargaNego.toLocaleString('id-ID')}`;
  })();

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

  // Track chat opens with the trigger that opened it (fires once per open)
  const openTriggerRef = useRef('');
  useEffect(() => {
    if (open) {
      trackEvent('chat_opened', handle, openTriggerRef.current);
      openTriggerRef.current = '';
    }
  }, [open]);

  // Off-hours floating button opens this chat via a window event
  useEffect(() => {
    const handler = () => {
      openTriggerRef.current = 'floating-button';
      setOpen(true);
      setIsCustomMode(true);
      setMessages(prev => prev.length > 0 ? prev : [{ role: 'ai', text: `Hi ka! Aku Grisela 😊 Ada yang ingin ditanyakan tentang ${title}? Silakan ketik pertanyaanmu ya` }]);
    };
    window.addEventListener('grisela:open', handler);
    return () => window.removeEventListener('grisela:open', handler);
  }, [title]);

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
    if (!open) openTriggerRef.current = custom ? 'tanya-hal-lain' : `bubble: ${question}`;
    // Every AI-generated question click is tracked with its text
    if (!custom) trackEvent('question_clicked', handle, question);
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
          productFreeBonus: freeBonus,
          productCicilan,
          productNego: negoInfo,
          productDiscontinued: isDiscontinued,
          productInStock: inStock,
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
      setMessages(prev => [
        ...prev,
        ...parts.map((text, idx) => ({
          role: 'ai',
          text,
          // Attach product/voucher/marketplace cards to the last bubble only
          products: idx === parts.length - 1 ? data.products ?? null : null,
          vouchers: idx === parts.length - 1 ? data.vouchers ?? null : null,
          marketplaces: idx === parts.length - 1 ? data.marketplaces ?? null : null,
        })),
      ]);
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
    if (!open) openTriggerRef.current = 'tanya-hal-lain';
    setOpen(true);
    setIsCustomMode(true);
    // Only show welcome message when starting fresh — don't wipe an ongoing conversation
    setMessages(prev => prev.length > 0 ? prev : [{ role: 'ai', text: `Hi ka! Aku Grisela 😊 Ada yang ingin ditanyakan tentang ${title}? Silakan ketik pertanyaanmu ya` }]);
  }

  const remainingQuestions = questions.filter(
    q => !messages.some(m => m.role === 'user' && m.text === q)
  );

  return (
    <div className="mt-3">
      {/* Section label */}
      <div className="flex items-center gap-1.5 mb-2">
        <GriselaAvatar size="w-5 h-5" />
        <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wide">Tanya AI Galaxy</p>
      </div>

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
                <GriselaAvatar size="w-8 h-8" />
                <div>
                  <p className="text-xs font-semibold text-gray-800 leading-none">Grisela</p>
                  <p className="text-[10px] text-emerald-500 font-medium mt-0.5">● AI Asisten Galaxy</p>
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

              {messages.map((msg, i) => (
                <ChatMessage
                  key={i}
                  msg={msg}
                  waMessage={`Halo admin Galaxy Camera 😊 Saya dari website, sudah chat dengan Grisela tentang produk "${title}". Mau tanya lebih lanjut ya.`}
                />
              ))}
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
