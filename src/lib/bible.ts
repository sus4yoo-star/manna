import type { LangCode } from "./types";

/**
 * MANNA is faith-neutral. What used to be a "Bible verse" block is now a
 * short, universal grounding line. We keep the same type/function names so
 * the parser and UI need no structural change — only the wording differs,
 * and there is no translation/version label.
 */
export interface BibleMeta {
  /** Localized label shown above the grounding-line block. */
  label: string;
  /** Kept for compatibility; intentionally empty (no scripture version). */
  version: string;
}

export const BIBLE_META: Record<LangCode, BibleMeta> = {
  ko: { label: "오늘의 질문", version: "" },
  en: { label: "A question for you", version: "" },
  th: { label: "คำถามสำหรับคุณ", version: "" },
  es: { label: "Una pregunta para ti", version: "" },
  pt: { label: "Uma pergunta para você", version: "" },
  hi: { label: "आपके लिए एक सवाल", version: "" },
  zh: { label: "给你的一个问题", version: "" },
};

/**
 * Light cleanup of the grounding line: drop wrapping quotes the model may
 * add, and a trailing period for Korean (matches the original styling).
 */
export function cleanVerseText(lang: LangCode, raw: string): string {
  let t = String(raw || "").trim();
  t = t.replace(/^["“”'']+|["“”'']+$/g, "").trim();
  if (lang === "ko") {
    t = t.replace(/[。!！?？\u3002]+$/g, "").trim();
  }
  return t;
}

export function bibleMeta(lang: LangCode): BibleMeta {
  return BIBLE_META[lang] || BIBLE_META.en;
}
