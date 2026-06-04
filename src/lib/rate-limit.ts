/**
 * Lightweight in-memory rate limiter (fixed window per key).
 *
 * NOTE: state lives in the running instance only. On serverless it is
 * per-instance and resets on cold start, so it is a *basic burst guard*
 * (protects against a single client hammering one warm instance), not a
 * globally-accurate quota. For hard, distributed limits, back this with a
 * shared store (e.g. Upstash Redis or a Postgres counter) later.
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  retryAfterSec: number;
}

/**
 * @param key       Identity to limit on (e.g. a user id).
 * @param limit     Max requests allowed inside the window.
 * @param windowMs  Window length in milliseconds.
 */
export function rateLimit(
  key: string,
  limit = 20,
  windowMs = 60_000
): RateLimitResult {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || now >= existing.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, retryAfterSec: 0 };
  }

  if (existing.count >= limit) {
    return {
      ok: false,
      remaining: 0,
      retryAfterSec: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }

  existing.count += 1;

  // Opportunistic cleanup so the map cannot grow unbounded on a long-lived
  // instance: occasionally drop expired buckets.
  if (buckets.size > 5000 && Math.random() < 0.01) {
    for (const [k, b] of buckets) {
      if (now >= b.resetAt) buckets.delete(k);
    }
  }

  return { ok: true, remaining: limit - existing.count, retryAfterSec: 0 };
}
