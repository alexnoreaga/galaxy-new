// One place for the Gemini text model list. gemini-2.5-flash is closed to new API keys since 2026-11
// (404 "no longer available to new users"); 3.8 is Google's successor, 3.5 the fallback for 503 "high demand".
export const GEMINI_MODELS = ['gemini-3.8-flash', 'gemini-3.5-flash'];

/** POST generateContent, moving to the next model on 404 / 429 / 503. Returns the last Response. */
export async function geminiGenerate(apiKey, body, { signal } = {}) {
  let res;
  for (const model of GEMINI_MODELS) {
    res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal,
      body: JSON.stringify(body),
    });
    if (res.ok || ![404, 429, 503].includes(res.status)) return res;
    console.warn('[gemini]', model, 'answered', res.status, '→ next model');
  }
  return res;
}
