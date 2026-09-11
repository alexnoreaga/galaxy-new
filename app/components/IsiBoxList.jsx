import { useEffect, useMemo, useState } from 'react';
import { parseIsiBox, pickActiveGroup, groupToText } from '~/lib/isiBox';

/**
 * Renders the "Isi Dalam Box" metafield.
 *
 * - No group headers in the text  → flat bullet list (unchanged from before).
 * - Headers present ("Isi Box Standard Bundle :") → one section per group. The group that
 *   matches the selected variant opens, the rest collapse. No match → everything open.
 * - `onCopy` (optional): clicking a group's list copies just that group.
 *
 * Shared by the desktop card (products.$handle.jsx) and the mobile tab (InfoProduk.jsx).
 */
export function IsiBoxList({ value, variantTitle, onCopy }) {
  const groups = useMemo(() => parseIsiBox(value), [value]);
  const activeIdx = useMemo(() => pickActiveGroup(groups, variantTitle), [groups, variantTitle]);
  const hasHeaders = groups.some((g) => g.title);

  // Which titled groups are expanded. Re-seeded whenever the variant (or text) changes.
  const [open, setOpen] = useState(() => seedOpen(groups, activeIdx));
  useEffect(() => {
    setOpen(seedOpen(groups, activeIdx));
  }, [groups, activeIdx]);

  if (!groups.length) return null;

  const copyGroup = (g) => {
    if (typeof onCopy === 'function') onCopy(groupToText(g));
  };
  const copyable = typeof onCopy === 'function';

  // ── Flat list (single-variant products) ─────────────────────────────────────
  if (!hasHeaders) {
    const g = groups[0];
    return (
      <div>
        <ul
          onClick={copyable ? () => copyGroup(g) : undefined}
          title={copyable ? 'Klik untuk menyalin' : undefined}
          className={`flex flex-col gap-2 ${copyable ? 'cursor-pointer group' : ''}`}
        >
          {g.items.map((str, i) => (
            <Item key={i + str} text={str} />
          ))}
        </ul>
        {copyable && <CopyHint label="Klik daftar untuk menyalin" />}
      </div>
    );
  }

  // ── Grouped list (multi-variant products) ──────────────────────────────────
  return (
    <div className="divide-y divide-gray-100">
      {groups.map((g, i) => {
        // Untitled leading lines (rare) stay visible above the groups.
        if (!g.title) {
          return (
            <ul key={`u${i}`} className="flex flex-col gap-2 py-2">
              {g.items.map((str, j) => (
                <Item key={j + str} text={str} />
              ))}
            </ul>
          );
        }
        const isOpen = !!open[i];
        const isActive = i === activeIdx;
        return (
          <div key={`g${i}`} className="py-1.5">
            <button
              type="button"
              onClick={() => setOpen((o) => ({ ...o, [i]: !o[i] }))}
              aria-expanded={isOpen}
              className="w-full flex items-center justify-between gap-3 py-1.5 text-left"
            >
              <span className="flex items-center gap-2 min-w-0">
                <span className={`text-sm truncate ${isActive ? 'font-semibold text-gray-900' : 'font-medium text-gray-600'}`}>
                  {g.title}
                </span>
                {isActive && (
                  <span className="shrink-0 text-[10px] font-medium leading-none px-1.5 py-1 rounded bg-gray-900 text-white">
                    Varian dipilih
                  </span>
                )}
                {!isOpen && (
                  <span className="shrink-0 text-xs text-gray-400">{g.items.length} item</span>
                )}
              </span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className={`w-4 h-4 shrink-0 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </button>
            {isOpen && (
              <ul
                onClick={copyable ? () => copyGroup(g) : undefined}
                title={copyable ? `Klik untuk menyalin isi box ${g.title}` : undefined}
                className={`flex flex-col gap-2 pb-2 pl-0.5 ${copyable ? 'cursor-pointer group' : ''}`}
              >
                {g.items.map((str, j) => (
                  <Item key={j + str} text={str} />
                ))}
              </ul>
            )}
          </div>
        );
      })}
      {copyable && <CopyHint label="Klik daftar untuk menyalin isi box varian tersebut" />}
    </div>
  );
}

function seedOpen(groups, activeIdx) {
  const next = {};
  groups.forEach((g, i) => {
    if (!g.title) return;
    next[i] = activeIdx < 0 ? true : i === activeIdx;
  });
  return next;
}

function Item({ text }) {
  return (
    <li className="flex items-start gap-2.5 text-sm text-gray-700 leading-snug">
      <span className="mt-2 w-1.5 h-1.5 rounded-full bg-slate-400 flex-shrink-0" />
      <span>{text}</span>
    </li>
  );
}

function CopyHint({ label }) {
  return (
    <div className="mt-2 pt-2 border-t border-gray-100 flex items-center gap-1.5 text-xs text-gray-400">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" className="w-3 h-3">
        <path
          fill="currentColor"
          d="M384 336l-192 0c-8.8 0-16-7.2-16-16l0-256c0-8.8 7.2-16 16-16l140.1 0L400 115.9 400 320c0 8.8-7.2 16-16 16zM192 384l192 0c35.3 0 64-28.7 64-64l0-204.1c0-12.7-5.1-24.9-14.1-33.9L366.1 14.1c-9-9-21.2-14.1-33.9-14.1L192 0c-35.3 0-64 28.7-64 64l0 256c0 35.3 28.7 64 64 64zM64 128c-35.3 0-64 28.7-64 64L0 448c0 35.3 28.7 64 64 64l192 0c35.3 0 64-28.7 64-64l0-32-48 0 0 32c0 8.8-7.2 16-16 16L64 464c-8.8 0-16-7.2-16-16l0-256c0-8.8 7.2-16 16-16l32 0 0-48-32 0z"
        />
      </svg>
      {label}
    </div>
  );
}
