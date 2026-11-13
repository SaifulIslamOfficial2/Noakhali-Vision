// One tiny text-generation helper for the whole server. Works with Google Gemini (preferred) or OpenAI.
//   GEMINI_API_KEY  -> Gemini   (GEMINI_MODEL optional, default gemini-3.5-flash-lite)
//   OPENAI_API_KEY  -> OpenAI   (OPENAI_MODEL optional, default gpt-4o-mini)
// If both keys are set Gemini is used, unless AI_PROVIDER=openai. Keys are read only on the server and never sent to the browser.
// Never logs the key. Throws LlmError (with a simple `code`) so callers can show a clear message.

export const GEMINI_DEFAULT_MODEL = "gemini-3.5-flash-lite";

export class LlmError extends Error {
  constructor(httpStatus, code, message) { super(message); this.httpStatus = httpStatus; this.code = code; }
}

export const llmProvider = () => {
  const g = !!process.env.GEMINI_API_KEY, o = !!process.env.OPENAI_API_KEY;
  if (g && o) return String(process.env.AI_PROVIDER || "").toLowerCase() === "openai" ? "openai" : "gemini";
  return g ? "gemini" : o ? "openai" : "";
};
export const llmOn = () => !!llmProvider();
export const llmKeyName = () => (llmProvider() === "openai" ? "OPENAI_API_KEY" : "GEMINI_API_KEY");

const trimSlash = (s) => String(s).replace(/\/+$/, "");

async function geminiCall({ system, user, json, maxTokens, temperature, timeoutMs }, model) {
  const base = trimSlash(process.env.GEMINI_API_BASE || "https://generativelanguage.googleapis.com");
  const res = await fetch(`${base}/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
    method: "POST",
    headers: { "x-goog-api-key": process.env.GEMINI_API_KEY, "Content-Type": "application/json" },
    signal: AbortSignal.timeout(timeoutMs),
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: "user", parts: [{ text: user }] }],
      generationConfig: { temperature, maxOutputTokens: Math.max(maxTokens * 4, 1024), ...(json ? { responseMimeType: "application/json" } : {}) },
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = String(err?.error?.message || "");
    let code = "other";
    if (res.status === 404) code = "model";
    else if (res.status === 429) code = "quota";
    else if (res.status === 401 || res.status === 403 || (res.status === 400 && /api key/i.test(msg))) code = "invalid_key";
    throw new LlmError(res.status, code, msg || `Gemini HTTP ${res.status}`);
  }
  const data = await res.json();
  const parts = data?.candidates?.[0]?.content?.parts || [];
  return parts.filter((p) => !p.thought).map((p) => p.text || "").join("").trim();
}

async function openaiCall({ system, user, json, maxTokens, temperature, timeoutMs }) {
  const res = await fetch(`${trimSlash(process.env.OPENAI_API_BASE || "https://api.openai.com")}/v1/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, "Content-Type": "application/json" },
    signal: AbortSignal.timeout(timeoutMs),
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini", temperature, max_tokens: maxTokens,
      ...(json ? { response_format: { type: "json_object" } } : {}),
      messages: [{ role: "system", content: system }, { role: "user", content: user }],
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const c = String(err?.error?.code || err?.error?.type || "");
    const code = { invalid_api_key: "invalid_key", insufficient_quota: "quota", rate_limit_exceeded: "quota", model_not_found: "model" }[c] || "other";
    throw new LlmError(res.status, code, String(err?.error?.message || `OpenAI HTTP ${res.status}`));
  }
  const data = await res.json();
  return String(data?.choices?.[0]?.message?.content || "").trim();
}

/** Returns the model's text. Throws LlmError on any failure (callers decide what to do). */
export async function llmChat({ system, user, json = false, maxTokens = 300, temperature = 0.2, timeoutMs = 8000 }) {
  const p = llmProvider();
  if (!p) throw new LlmError(503, "off", "No AI key set");
  const args = { system, user, json, maxTokens, temperature, timeoutMs };
  if (p === "openai") return openaiCall(args);
  const model = process.env.GEMINI_MODEL || GEMINI_DEFAULT_MODEL;
  try { return await geminiCall(args, model); }
  catch (e) {
    // an old/retired model name in GEMINI_MODEL (e.g. gemini-2.0-flash) -> retry once with the current default
    if (e instanceof LlmError && e.code === "model" && model !== GEMINI_DEFAULT_MODEL) {
      console.error(`gemini: model "${model}" not available, retrying with ${GEMINI_DEFAULT_MODEL}`);
      return geminiCall(args, GEMINI_DEFAULT_MODEL);
    }
    throw e;
  }
}
