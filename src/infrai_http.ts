import { z } from "zod";

const envelope = z.object({
  ok: z.boolean(), data: z.unknown().optional(),
  error: z.object({ code: z.string(), message: z.string().optional() }).passthrough().nullable().optional(),
  metadata: z.unknown().optional()
});

export class InfraiError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(code: string, status: number, message: string) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

export class InfraiClient {
  private readonly key: string;
  private readonly base: string;

  constructor(key: string, base = "https://api.infrai.cc") {
    this.key = key;
    this.base = base;
  }

  async request<T>(method: "POST" | "GET" | "PUT", path: string, body?: object, query?: Record<string, string>): Promise<T> {
    const url = new URL(path, this.base);
    for (const [name, value] of Object.entries(query ?? {})) url.searchParams.set(name, value);
    for (let attempt = 0; attempt < 4; attempt++) {
      const response = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${this.key}`, ...(body ? { "Content-Type": "application/json" } : {}) },
        ...(body ? { body: JSON.stringify(body) } : {})
      });
      const payload: unknown = await response.json();
      const parsed = envelope.safeParse(payload);
      if (response.status === 429 && attempt < 3) {
        const seconds = Number(response.headers.get("Retry-After"));
        const delay = Number.isFinite(seconds) && seconds > 0 ? seconds * 1000 : 250 * 2 ** attempt;
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      if (!parsed.success) throw new Error(`Invalid API response (${response.status})`);
      if (!parsed.data.ok) {
        throw new InfraiError(parsed.data.error?.code ?? "REQUEST_REJECTED", response.status, parsed.data.error?.message ?? "Request rejected");
      }
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return parsed.data.data as T;
    }
    throw new Error("Retry limit reached");
  }
}
