export async function fetchText(
  url: string,
  opts: { timeoutMs?: number; headers?: Record<string, string>; method?: string } = {},
): Promise<{ ok: boolean; status: number; text: string; finalUrl: string }> {
  const timeoutMs = opts.timeoutMs ?? 8000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: opts.method ?? "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent": "EntityIQ/1.0 (public-entity-audit; +https://entityiq.app)",
        Accept: "text/html,application/json,application/xml;q=0.9,*/*;q=0.8",
        ...opts.headers,
      },
    });
    const text = await res.text();
    return { ok: res.ok, status: res.status, text, finalUrl: res.url || url };
  } catch {
    return { ok: false, status: 0, text: "", finalUrl: url };
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchJson<T>(
  url: string,
  opts: { timeoutMs?: number; headers?: Record<string, string>; method?: string; body?: string } = {},
): Promise<{ ok: boolean; status: number; data: T | null }> {
  const timeoutMs = opts.timeoutMs ?? 8000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: opts.method ?? "GET",
      signal: controller.signal,
      headers: {
        "User-Agent": "EntityIQ/1.0 (public-entity-audit)",
        Accept: "application/json",
        ...(opts.body ? { "Content-Type": "application/json" } : {}),
        ...opts.headers,
      },
      body: opts.body,
    });
    const data = (await res.json()) as T;
    return { ok: res.ok, status: res.status, data };
  } catch {
    return { ok: false, status: 0, data: null };
  } finally {
    clearTimeout(timer);
  }
}
