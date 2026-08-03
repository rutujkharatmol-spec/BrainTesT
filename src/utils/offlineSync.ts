const OFFLINE_QUEUE_KEY = "offlineSyncQueue";

type QueuedRequest = {
  id: string;
  url: string;
  method: string;
  headers: Record<string, string>;
  body: string;
  timestamp: number;
};

function getQueue(): QueuedRequest[] {
  try {
    const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveQueue(queue: QueuedRequest[]): void {
  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
}

/**
 * A drop-in replacement for `fetch` that queues requests when offline.
 * When the device is offline, it saves the request to localStorage and
 * returns a fake successful Response so the UI can proceed normally.
 */
export async function fetchWithOfflineSync(
  url: string,
  options: RequestInit
): Promise<Response> {
  // If online, try the real fetch first
  if (navigator.onLine) {
    try {
      const res = await fetch(url, options);
      // Return the actual response (whether ok or error) so the UI
      // can display server-side errors properly instead of masking them.
      return res;
    } catch {
      // Network error (e.g. DNS failure, connection refused) — fall through to queue
    }
  }

  // Queue the request for later
  const queued: QueuedRequest = {
    id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
    url,
    method: (options.method || "POST").toUpperCase(),
    headers: (options.headers as Record<string, string>) || {},
    body: (options.body as string) || "",
    timestamp: Date.now(),
  };

  const queue = getQueue();
  queue.push(queued);
  saveQueue(queue);

  console.log(`[OfflineSync] Queued request to ${url}. Queue size: ${queue.length}`);

  // Return a fake success response so the app flow continues
  return new Response(JSON.stringify({ ok: true, offline: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * Processes all queued offline requests. Call this when the device comes
 * back online. Successfully sent requests are removed from the queue.
 */
export async function processOfflineQueue(): Promise<{ sent: number; failed: number }> {
  const queue = getQueue();
  if (queue.length === 0) return { sent: 0, failed: 0 };

  console.log(`[OfflineSync] Processing ${queue.length} queued request(s)...`);

  const remaining: QueuedRequest[] = [];
  let sent = 0;

  for (const req of queue) {
    try {
      const res = await fetch(req.url, {
        method: req.method,
        headers: req.headers,
        body: req.body,
      });

      if (res.ok) {
        sent++;
        console.log(`[OfflineSync] ✓ Synced: ${req.url}`);
      } else {
        console.warn(`[OfflineSync] ✗ Server error for ${req.url}, keeping in queue.`);
        remaining.push(req);
      }
    } catch {
      console.warn(`[OfflineSync] ✗ Still offline for ${req.url}, keeping in queue.`);
      remaining.push(req);
    }
  }

  saveQueue(remaining);
  console.log(`[OfflineSync] Done. Sent: ${sent}, Remaining: ${remaining.length}`);
  return { sent, failed: remaining.length };
}

/**
 * Returns the number of queued offline requests.
 */
export function getOfflineQueueSize(): number {
  return getQueue().length;
}
