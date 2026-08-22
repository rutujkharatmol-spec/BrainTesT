/**
 * Minimal in-memory rate limiter for auth endpoints.
 *
 * Deliberately dependency-free and process-local. On a single long-lived
 * server this is exactly what we need; on serverless it degrades to
 * per-instance limiting, which still removes the "unlimited attempts from one
 * caller" property that makes a short admin password trivially brute-forcible.
 *
 * If this app ever runs at scale, swap the Map for Redis/Upstash — the
 * `checkRateLimit` signature is designed not to change.
 */

type Bucket = {
  count: number;
  firstAttempt: number;
  blockedUntil?: number;
};

const buckets = new Map<string, Bucket>();

// Keep the map from growing without bound on a long-lived process.
const MAX_BUCKETS = 10_000;

function sweep(now: number, windowMs: number) {
  if (buckets.size < MAX_BUCKETS) return;
  // Array.from keeps this compatible with the project's ES5 target.
  Array.from(buckets.keys()).forEach((key) => {
    const b = buckets.get(key);
    if (!b) return;
    const expired = now - b.firstAttempt > windowMs && (!b.blockedUntil || b.blockedUntil < now);
    if (expired) buckets.delete(key);
  });
}

export type RateLimitResult = {
  allowed: boolean;
  /** Seconds the caller should wait before retrying. */
  retryAfter: number;
  remaining: number;
};

export function checkRateLimit(
  key: string,
  { limit = 5, windowMs = 15 * 60_000, blockMs = 15 * 60_000 } = {}
): RateLimitResult {
  const now = Date.now();
  sweep(now, windowMs);

  const bucket = buckets.get(key);

  if (bucket?.blockedUntil && bucket.blockedUntil > now) {
    return { allowed: false, retryAfter: Math.ceil((bucket.blockedUntil - now) / 1000), remaining: 0 };
  }

  if (!bucket || now - bucket.firstAttempt > windowMs) {
    buckets.set(key, { count: 1, firstAttempt: now });
    return { allowed: true, retryAfter: 0, remaining: limit - 1 };
  }

  bucket.count += 1;

  if (bucket.count > limit) {
    // Back off harder the more they overshoot, capped at an hour.
    const overshoot = bucket.count - limit;
    bucket.blockedUntil = now + Math.min(blockMs * overshoot, 60 * 60_000);
    return { allowed: false, retryAfter: Math.ceil((bucket.blockedUntil - now) / 1000), remaining: 0 };
  }

  return { allowed: true, retryAfter: 0, remaining: limit - bucket.count };
}

/** Clears a caller's budget after a successful authentication. */
export function resetRateLimit(key: string): void {
  buckets.delete(key);
}

/** Best-effort client IP from proxy headers (Vercel sets x-forwarded-for). */
export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}
