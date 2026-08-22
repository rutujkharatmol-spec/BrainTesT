const OFFLINE_QUEUE_KEY = "offlineSyncQueue";
const DEAD_LETTER_KEY = "offlineSyncDeadLetter";
const ID_MAP_KEY = "offlineSyncIdMap";

/** Session ids minted locally while offline carry this prefix. */
export const OFFLINE_SESSION_PREFIX = "offline-";

export type QueuedRequest = {
  id: string;
  url: string;
  method: string;
  headers: Record<string, string>;
  body: string;
  timestamp: number;
  /**
   * "signup" must be replayed before anything else, because it is what mints
   * the real server-side sessionId that every later submission refers to.
   */
  kind: "signup" | "submission";
  /** Placeholder session id this request was recorded against, if any. */
  offlineSessionId?: string;
  attempts?: number;
  lastError?: string;
};

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    // Quota exceeded or storage disabled. Nothing useful to do here, but we
    // must not throw — that would break the task flow mid-assessment.
    console.error(`[OfflineSync] Could not persist ${key}`, e);
  }
}

function getQueue(): QueuedRequest[] {
  return readJson<QueuedRequest[]>(OFFLINE_QUEUE_KEY, []);
}

function saveQueue(queue: QueuedRequest[]): void {
  writeJson(OFFLINE_QUEUE_KEY, queue);
}

/** Placeholder offline session id -> real server id, once known. */
function getIdMap(): Record<string, string> {
  return readJson<Record<string, string>>(ID_MAP_KEY, {});
}

function saveIdMap(map: Record<string, string>): void {
  writeJson(ID_MAP_KEY, map);
}

/** Requests that failed permanently (4xx) and will never be retried. */
export function getDeadLetters(): QueuedRequest[] {
  return readJson<QueuedRequest[]>(DEAD_LETTER_KEY, []);
}

function saveDeadLetters(items: QueuedRequest[]): void {
  writeJson(DEAD_LETTER_KEY, items);
}

export function clearDeadLetters(): void {
  try {
    localStorage.removeItem(DEAD_LETTER_KEY);
  } catch {
    /* ignore */
  }
}

function classify(url: string): QueuedRequest["kind"] {
  return url.includes("/auth/participant/signup") ? "signup" : "submission";
}

/** Pulls sessionId out of a queued JSON body, if present. */
function bodySessionId(body: string): string | undefined {
  try {
    const parsed = JSON.parse(body);
    return typeof parsed?.sessionId === "string" ? parsed.sessionId : undefined;
  } catch {
    return undefined;
  }
}

/**
 * A drop-in replacement for `fetch` that queues requests when offline.
 *
 * When offline it stores the request and returns a synthetic response marked
 * `offline: true`. Callers MUST check that flag rather than treating the 200
 * as a real server acknowledgement — the write has not happened yet.
 */
export async function fetchWithOfflineSync(
  url: string,
  options: RequestInit
): Promise<Response> {
  if (navigator.onLine) {
    try {
      // Return the real response (ok or not) so the UI can surface genuine
      // server-side errors instead of masking them.
      return await fetch(url, options);
    } catch {
      // Network-layer failure (DNS, refused, timeout) — fall through to queue.
    }
  }

  const body = (options.body as string) || "";
  const queued: QueuedRequest = {
    id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
    url,
    method: (options.method || "POST").toUpperCase(),
    headers: (options.headers as Record<string, string>) || {},
    body,
    timestamp: Date.now(),
    kind: classify(url),
    offlineSessionId: bodySessionId(body),
    attempts: 0,
  };

  const queue = getQueue();
  queue.push(queued);
  saveQueue(queue);

  console.log(`[OfflineSync] Queued ${queued.kind} -> ${url}. Queue size: ${queue.length}`);

  return new Response(JSON.stringify({ ok: true, offline: true }), {
    status: 202,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * Records the mapping from a locally-minted offline session id to the real one
 * the server issued, so queued submissions can be repointed at replay time.
 */
export function mapOfflineSessionId(offlineId: string, realId: string): void {
  if (!offlineId || !realId || offlineId === realId) return;
  const map = getIdMap();
  map[offlineId] = realId;
  saveIdMap(map);
}

/** Rewrites a queued body's sessionId using the known mapping. */
function rewriteBody(req: QueuedRequest, idMap: Record<string, string>): string {
  const current = bodySessionId(req.body);
  if (!current) return req.body;
  const real = idMap[current];
  if (!real) return req.body;
  try {
    const parsed = JSON.parse(req.body);
    parsed.sessionId = real;
    return JSON.stringify(parsed);
  } catch {
    return req.body;
  }
}

export type SyncResult = {
  sent: number;
  failed: number;
  dropped: number;
};

/**
 * Replays queued requests. Call when the device comes back online.
 *
 * Ordering matters: signups go first so their real sessionId is known before
 * submissions that reference the offline placeholder are replayed. Without
 * that, every queued submission is rejected with "Invalid session" and — since
 * a failure used to mean "requeue" — the queue could never drain and the
 * participant's entire offline session was silently lost.
 */
export async function processOfflineQueue(): Promise<SyncResult> {
  const queue = getQueue();
  if (queue.length === 0) return { sent: 0, failed: 0, dropped: 0 };

  console.log(`[OfflineSync] Processing ${queue.length} queued request(s)...`);

  const idMap = getIdMap();
  const ordered = [
    ...queue.filter((r) => r.kind === "signup"),
    ...queue.filter((r) => r.kind !== "signup"),
  ];

  const remaining: QueuedRequest[] = [];
  const dead: QueuedRequest[] = getDeadLetters();
  let sent = 0;
  let dropped = 0;

  for (const req of ordered) {
    const body = rewriteBody(req, idMap);

    try {
      const res = await fetch(req.url, {
        method: req.method,
        headers: req.headers,
        body,
      });

      if (res.ok) {
        sent++;

        // A replayed signup returns the authoritative sessionId. Record it so
        // the submissions queued behind it get repointed.
        if (req.kind === "signup" && req.offlineSessionId) {
          try {
            const data = await res.clone().json();
            if (data?.sessionId) {
              idMap[req.offlineSessionId] = data.sessionId;
              saveIdMap(idMap);
            }
          } catch {
            /* non-JSON response; nothing to map */
          }
        }
        continue;
      }

      if (res.status >= 400 && res.status < 500) {
        // Permanent: replaying will never succeed (bad session, duplicate,
        // validation). Retrying forever is what wedged the old queue.
        req.attempts = (req.attempts ?? 0) + 1;
        req.lastError = `HTTP ${res.status}`;
        dead.push(req);
        dropped++;
        console.warn(`[OfflineSync] Permanent failure (${res.status}) for ${req.url}; moved to dead letter.`);
        continue;
      }

      // 5xx — server-side and possibly transient. Keep for the next attempt.
      req.attempts = (req.attempts ?? 0) + 1;
      req.lastError = `HTTP ${res.status}`;
      remaining.push(req);
    } catch {
      req.attempts = (req.attempts ?? 0) + 1;
      req.lastError = "network";
      remaining.push(req);
    }
  }

  saveQueue(remaining);
  saveDeadLetters(dead);

  console.log(`[OfflineSync] Done. Sent: ${sent}, retrying: ${remaining.length}, dropped: ${dropped}`);
  return { sent, failed: remaining.length, dropped };
}

export function getOfflineQueueSize(): number {
  return getQueue().length;
}

export function getDeadLetterCount(): number {
  return getDeadLetters().length;
}
