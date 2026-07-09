import { useState, useEffect, useRef } from 'react';
import { FaWhatsapp, FaTiktok, FaYoutube, FaLocationDot, FaCameraRetro, FaBuilding, FaChevronRight } from 'react-icons/fa6';
import {
  getSessionId,
  trackEvent,
  GriselaAvatar,
  TypingIndicator,
  ChatMessage,
} from '~/components/ProductAIChat';

export const meta = () => {
  return [
    { title: 'Galaxy Camera — Semua Link' },
    { name: 'description', content: 'Toko kamera terpercaya sejak 2014 · Tangerang & Depok. Chat AI Grisela, belanja online, dan kunjungi toko kami.' },
    { name: 'robots', content: 'noindex' },
  ];
};

const LOGO = 'https://cdn.shopify.com/s/files/1/0672/3806/8470/files/logo-galaxy-web-new.png?v=1731132105';
const WA_LINK = `https://wa.me/6282111311131?text=${encodeURIComponent('Halo admin Galaxy Camera 😊 Saya dari Instagram, mau tanya-tanya ya')}`;

const LINK_GROUPS = [
  {
    label: 'Belanja Online',
    links: [
      { name: 'Website Resmi Galaxy.co.id', href: '/', icon: <img src="/favicon-96x96.png" alt="" className="w-6 h-6 object-contain" />, iconBg: 'bg-white', featured: true },
      { name: 'Tokopedia', href: 'https://www.tokopedia.com/galaxycamera', badge: 'T', badgeColor: '#03ac0e' },
      { name: 'Shopee', href: 'https://shopee.co.id/galaxycamera', badge: 'S', badgeColor: '#ee4d2d' },
      { name: 'Blibli', href: 'https://www.blibli.com/merchant/galaxy-camera-flagship-store/GAC-49845', badge: 'B', badgeColor: '#0095da' },
    ],
  },
  {
    label: 'Kunjungi Toko — Bisa Nego Langsung!',
    links: [
      { name: 'Toko Tangerang · Metropolis Town Square', href: 'https://www.google.com/maps/search/?api=1&query=Galaxy+Camera+Mall+Metropolis+Town+Square+Tangerang', icon: <FaLocationDot className="text-emerald-600" />, iconBg: 'bg-emerald-50' },
      { name: 'Toko Depok · Depok Town Square', href: 'https://www.google.com/maps/search/?api=1&query=Galaxy+Camera+Depok+Town+Square', icon: <FaLocationDot className="text-emerald-600" />, iconBg: 'bg-emerald-50' },
    ],
  },
  {
    label: 'Layanan Lainnya',
    links: [
      { name: 'Jual Kamera Bekas Kamu', href: 'https://kamerabekas.id', icon: <FaCameraRetro className="text-amber-600" />, iconBg: 'bg-amber-50' },
      { name: 'Pengadaan Kantor / Sekolah / Instansi', href: '/pengadaan', icon: <FaBuilding className="text-blue-600" />, iconBg: 'bg-blue-50' },
    ],
  },
  {
    label: 'Ikuti Kami',
    links: [
      { name: 'TikTok @galaxycameraid', href: 'https://www.tiktok.com/@galaxycameraid', icon: <FaTiktok className="text-gray-900" />, iconBg: 'bg-gray-100' },
      { name: 'YouTube Galaxy Camera', href: 'https://www.youtube.com/galaxycamera', icon: <FaYoutube className="text-red-600" />, iconBg: 'bg-red-50' },
    ],
  },
];

const QUICK_QUESTIONS = [
  'Rekomendasi kamera buat pemula',
  'Lagi ada promo apa?',
  'Bisa cicilan tanpa kartu kredit?',
  'Lokasi toko di mana?',
];

function BioChat({ open, onClose }) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      trackEvent('chat_opened', 'instagram-bio');
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
          productHandle: 'instagram-bio',
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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
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
              waMessage={'Halo admin Galaxy Camera 😊 Saya dari Instagram, sudah chat dengan Grisela. Mau tanya lebih lanjut ya.'}
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
                  onClick={() => ask(q)}
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

export default function Bio() {
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 via-white to-white">
      <div className="max-w-md mx-auto px-4 py-10">
        {/* Header */}
        <div className="text-center mb-7">
          <img src={LOGO} alt="Galaxy Camera" className="h-12 mx-auto mb-3 object-contain" />
          <p className="text-sm text-gray-500">
            Toko Kamera Terpercaya sejak 2014
            <br />
            Tangerang · Depok · Garansi Resmi
          </p>
        </div>

        {/* Grisela hero button */}
        <button
          onClick={() => setChatOpen(true)}
          className="w-full flex items-center gap-3 bg-rose-600 hover:bg-rose-700 active:scale-[0.98] text-white rounded-2xl px-4 py-3.5 shadow-lg shadow-rose-200 transition-all mb-7"
        >
          <div className="relative flex-shrink-0">
            <GriselaAvatar size="w-12 h-12" />
            <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-rose-600">
              <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-75" />
            </span>
          </div>
          <div className="flex-1 text-left">
            <p className="font-bold text-[15px] leading-tight">Tanya Grisela</p>
            <p className="text-xs text-rose-100 mt-0.5">Asisten AI Galaxy — Online 24 Jam</p>
          </div>
          <FaChevronRight className="text-rose-200 flex-shrink-0" />
        </button>

        {/* WhatsApp admin — right below Grisela */}
        <a
          href={WA_LINK}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackEvent('bio_link_clicked', '', 'Chat Admin WhatsApp')}
          className="w-full flex items-center gap-3 bg-green-600 hover:bg-green-700 active:scale-[0.98] text-white rounded-2xl px-4 py-3.5 shadow-lg shadow-green-200 transition-all -mt-4 mb-7"
        >
          <span className="w-12 h-12 rounded-full bg-white/15 flex items-center justify-center flex-shrink-0">
            <FaWhatsapp className="text-2xl" />
          </span>
          <div className="flex-1 text-left">
            <p className="font-bold text-[15px] leading-tight">Chat Admin WhatsApp</p>
            <p className="text-xs text-green-100 mt-0.5">Dilayani langsung oleh tim kami</p>
          </div>
          <FaChevronRight className="text-green-200 flex-shrink-0" />
        </a>

        {/* Link groups */}
        {LINK_GROUPS.map(group => (
          <div key={group.label} className="mb-6">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1">{group.label}</p>
            <div className="flex flex-col gap-2">
              {group.links.map(link => (
                <a
                  key={link.name}
                  href={link.href}
                  target={link.href.startsWith('http') ? '_blank' : undefined}
                  rel={link.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                  onClick={() => trackEvent('bio_link_clicked', '', link.name)}
                  className={`flex items-center gap-3 rounded-xl px-3.5 py-3 transition-all group ${
                    link.featured
                      ? 'bg-rose-50 border-2 border-rose-300 hover:border-rose-500 hover:shadow-lg hover:shadow-rose-100'
                      : 'bg-white border border-gray-200 hover:border-rose-300 hover:shadow-md'
                  }`}
                >
                  {link.badge ? (
                    <span
                      className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-black flex-shrink-0"
                      style={{ backgroundColor: link.badgeColor }}
                    >
                      {link.badge}
                    </span>
                  ) : (
                    <span className={`w-9 h-9 rounded-full ${link.iconBg} flex items-center justify-center text-base flex-shrink-0 ${link.featured ? 'shadow-sm' : ''}`}>
                      {link.icon}
                    </span>
                  )}
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-semibold text-gray-800 leading-snug">{link.name}</span>
                    {link.featured && (
                      <span className="block text-[11px] text-rose-600 font-medium mt-0.5">Ada voucher tambahan khusus website 🎟️</span>
                    )}
                  </span>
                  <FaChevronRight className={`text-xs flex-shrink-0 transition-colors ${link.featured ? 'text-rose-400 group-hover:text-rose-600' : 'text-gray-300 group-hover:text-rose-400'}`} />
                </a>
              ))}
            </div>
          </div>
        ))}

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 mt-8">
          Buka Setiap Hari · 10.00–19.00 WIB
          <br />© {new Date().getFullYear()} Galaxy Camera
        </p>
      </div>

      <BioChat open={chatOpen} onClose={() => setChatOpen(false)} />
    </div>
  );
}
