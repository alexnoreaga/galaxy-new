// "Isi Dalam Box" parser for multi-variant products.
//
// Staff fill the `custom.isi_dalam_box` metafield as plain text. Convention that emerged
// on the floor (see Insta360 Luna Ultra / X5):
//
//   Isi Box Standard Bundle :      ← line ending with ":" = group header (one per variant)
//   1x Kamera
//   1x Kabel USB-C
//                                  ← blank line = separator (ignored)
//   Isi Box Creator Bundle :
//   ...
//
// Products without any header (e.g. Sony ZV-E10) parse to ONE untitled group and render
// exactly like the old flat bullet list.

const HEADER_RE = /:\s*$/;
const MAX_HEADER_LEN = 80;

/**
 * @param {string|null|undefined} value raw metafield text
 * @returns {{title: string|null, items: string[]}[]}
 */
export function parseIsiBox(value) {
  const lines = String(value ?? '').replace(/\r/g, '').split('\n');
  const groups = [];
  let cur = null;
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue; // blank line = separator, carries no content
    // A header is a short line that ends with ":" and doesn't start like a quantity ("1x", "2 pcs").
    if (HEADER_RE.test(line) && line.length <= MAX_HEADER_LEN && !/^\d/.test(line)) {
      cur = { title: line.replace(/\s*:\s*$/, '').trim(), items: [] };
      groups.push(cur);
      continue;
    }
    if (!cur) {
      cur = { title: null, items: [] };
      groups.push(cur);
    }
    cur.items.push(line);
  }
  return groups.filter((g) => g.items.length > 0);
}

// Words that carry no identity — "Isi Box Standard Bundle" and variant "Standard Combo"
// must still match on "standard".
const NOISE = new Set([
  'isi', 'box', 'dalam', 'paket', 'package', 'bundle', 'combo', 'kit', 'set', 'edition',
  'edisi', 'varian', 'variant', 'versi', 'version', 'only', 'saja', 'dan', 'and', 'with',
  'dengan', 'the', 'of', 'untuk', 'for',
]);

function tokens(str) {
  return String(str ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .split(' ')
    .filter((t) => t && !NOISE.has(t));
}

function norm(str) {
  return String(str ?? '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

/**
 * Pick the group that best matches the selected variant title.
 * Returns the index, or -1 when nothing matches (caller shows every group open).
 *
 * @param {{title: string|null, items: string[]}[]} groups
 * @param {string|null|undefined} variantTitle e.g. "Standard Combo", "Creator Bundle", "Hitam / 128GB"
 */
export function pickActiveGroup(groups, variantTitle) {
  if (!Array.isArray(groups) || groups.length < 2) return -1;
  if (!variantTitle || variantTitle === 'Default Title') return -1;
  const vNorm = norm(variantTitle);
  const vTokens = new Set(tokens(variantTitle));
  if (!vTokens.size) return -1;

  let best = -1;
  let bestScore = 0;
  groups.forEach((g, i) => {
    if (!g.title) return;
    const hNorm = norm(g.title);
    let score = 0;
    // Strong signal: one contains the other ("Creator Bundle" ⊂ "Isi Box Creator Bundle").
    if (hNorm && (hNorm.includes(vNorm) || vNorm.includes(hNorm))) score = 10;
    const hTokens = tokens(g.title);
    if (!hTokens.length) return;
    let overlap = 0;
    for (const t of hTokens) if (vTokens.has(t)) overlap++;
    // Token overlap, weighted by how much of the shorter side matched.
    score += overlap / Math.min(hTokens.length, vTokens.size);
    if (score > bestScore) {
      bestScore = score;
      best = i;
    }
  });
  return bestScore > 0 ? best : -1;
}

/** Plain-text form of one group, for the copy button. */
export function groupToText(group) {
  if (!group) return '';
  return (group.title ? `${group.title}:\n` : '') + group.items.join('\n');
}
