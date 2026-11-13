// Short AI summary for a news story (used when an editor leaves the Summary box empty).
// Needs GEMINI_API_KEY (or OPENAI_API_KEY) on the server. Never throws: on any problem it returns "" and the story is saved as usual.
import { stripHtml } from "../../src/utils/richText.js";
import { llmChat, llmOn } from "./llm.js";

export const aiOn = () => llmOn();

/** Returns a 2-3 sentence summary in the story's own language, or "" if AI is off / fails. */
export async function generateSummary(html, { timeoutMs = 8000 } = {}) {
  if (!llmOn()) return "";
  const plain = stripHtml(String(html || "")).replace(/\s+/g, " ").trim();
  if (plain.length < 80) return "";
  const bangla = (plain.match(/[ঀ-৿]/g) || []).length > plain.length * 0.15;
  try {
    const text = await llmChat({
      system: `You are a careful newsroom editor. Summarise the story in 2 or 3 short sentences (max 60 words) in ${bangla ? "Bangla" : "English"}. Use only facts explicitly present in the text. Never invent names, dates, quotes, numbers or causes. Output the summary text only.`,
      user: plain.slice(0, 12000), maxTokens: 220, timeoutMs,
    });
    return String(text || "").replace(/\s+/g, " ").trim().slice(0, 600);
  } catch (e) {
    console.error("ai summary failed:", e?.code || "", e?.message || e);
    return "";
  }
}
