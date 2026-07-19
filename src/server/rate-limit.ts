/**
 * Rate limiter for auth and sensitive routes (fixed window).
 *
 * On serverless (Vercel), an in-memory store is per-instance and unreliable, so
 * this uses Upstash Redis when `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`
 * are set (distributed, shared across all instances). Without those vars it falls
 * back to an in-memory store — fine for local dev / single-instance.
 *
 * Fails OPEN: if Upstash is unreachable we degrade to in-memory rather than
 * lock users out over a transient outage.
 */
type Bucket = { count: number; resetAt: number };

const store = new Map<string, Bucket>();

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  retryAfterMs: number;
}

interface Options {
  limit?: number;
  windowMs?: number;
}

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

function upstashConfigured(): boolean {
  return Boolean(UPSTASH_URL && UPSTASH_TOKEN);
}

function inMemory(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const bucket = store.get(key);

  if (!bucket || bucket.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, retryAfterMs: 0 };
  }

  bucket.count += 1;
  if (bucket.count > limit) {
    return { ok: false, remaining: 0, retryAfterMs: bucket.resetAt - now };
  }
  return { ok: true, remaining: limit - bucket.count, retryAfterMs: 0 };
}

/**
 * Distributed fixed-window via Upstash REST: INCR the key, and set the TTL only
 * on the first hit (`EXPIRE ... NX`). One atomic pipeline round-trip.
 */
async function upstash(key: string, limit: number, windowMs: number): Promise<RateLimitResult> {
  const seconds = Math.max(1, Math.ceil(windowMs / 1000));
  const redisKey = `rl:${key}`;
  const res = await fetch(`${UPSTASH_URL}/pipeline`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${UPSTASH_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify([
      ["INCR", redisKey],
      ["EXPIRE", redisKey, seconds, "NX"],
    ]),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Upstash HTTP ${res.status}`);
  const data = (await res.json()) as Array<{ result?: number; error?: string }>;
  if (data[0]?.error) throw new Error(`Upstash: ${data[0].error}`);
  const count = data[0]?.result ?? 0;
  if (count > limit) {
    return { ok: false, remaining: 0, retryAfterMs: seconds * 1000 };
  }
  return { ok: true, remaining: Math.max(0, limit - count), retryAfterMs: 0 };
}

export async function rateLimit(
  key: string,
  { limit = 5, windowMs = 60_000 }: Options = {},
): Promise<RateLimitResult> {
  if (upstashConfigured()) {
    try {
      return await upstash(key, limit, windowMs);
    } catch (e) {
      console.error("[rate-limit] Upstash indisponible, repli mémoire:", e);
      return inMemory(key, limit, windowMs);
    }
  }
  return inMemory(key, limit, windowMs);
}

/** Best-effort client IP from standard proxy headers. */
export function clientIp(headers: Headers): string {
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip") ||
    "unknown"
  );
}
