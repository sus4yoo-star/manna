/**
 * Shared helpers for talking to the Anthropic Messages API.
 *
 * MANNA runs on Claude. Quality is the priority over latency, so the
 * default is a strong model; it can be overridden per environment with
 * the ANTHROPIC_MODEL variable (e.g. set it to "claude-opus-4-7" for the
 * deepest possible responses, or to a cheaper model to cut cost).
 */

export const ANTHROPIC_VERSION = "2023-06-01";

/**
 * Default model. Claude Sonnet 4.6 is a very large quality jump over the
 * old gpt-4o-mini for warm, specific, non-clichéd multilingual support,
 * while staying affordable for a donation-funded public app.
 *
 * To go deeper, set ANTHROPIC_MODEL="claude-opus-4-7" in the environment.
 */
export function defaultModel(): string {
  const m = String(process.env.ANTHROPIC_MODEL || "").trim();
  return m || "claude-sonnet-4-6";
}

export interface ParsedDataUrl {
  mediaType: string;
  data: string;
}

/**
 * Splits a browser data-URL ("data:image/jpeg;base64,XXXX") into the
 * media type and the raw base64 payload that Anthropic expects in an
 * image content block. Returns null if it is not a usable base64 image.
 */
export function splitDataUrl(dataUrl: string): ParsedDataUrl | null {
  const m = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/s.exec(
    String(dataUrl || "")
  );
  if (!m) return null;
  let mediaType = m[1].toLowerCase();
  // Anthropic accepts jpeg, png, gif, webp. Normalise common variants.
  if (mediaType === "image/jpg") mediaType = "image/jpeg";
  const allowed = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  if (!allowed.includes(mediaType)) return null;
  const data = m[2].trim();
  if (!data) return null;
  return { mediaType, data };
}
