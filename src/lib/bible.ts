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
  ko: { label: "마음에 새길 한 문장", version: "" },
  en: { label: "A line to hold onto", version: "" },
  th: { label: "ประโยคที่ควรจดจำ", version: "" },
  es: { label: "Una frase para sostenerte", version: "" },
  pt: { label: "Uma frase para guardar", version: "" },
  hi: { label: "थामे रखने योग्य एक पंक्ति", version: "" },
  zh: { label: "值得记住的一句话", version: "" },
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
