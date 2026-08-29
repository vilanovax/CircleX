import { withBasePath } from "./avatar";

export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(status: number, message: string, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

const GET_TTL_MS = 8_000;
const inflight = new Map<string, Promise<unknown>>();
const memo = new Map<string, { at: number; data: unknown }>();

function requestKey(path: string, init?: RequestInit): string {
  const method = (init?.method ?? "GET").toUpperCase();
  const body =
    typeof init?.body === "string"
      ? init.body
      : init?.body instanceof FormData
        ? "[form]"
        : "";
  return `${method} ${path} ${body}`;
}

export function invalidateApiCache(): void {
  memo.clear();
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const method = (init?.method ?? "GET").toUpperCase();
  const key = requestKey(path, init);
  const isGet = method === "GET";

  if (!isGet) {
    invalidateApiCache();
  } else {
    const hit = memo.get(key);
    if (hit && Date.now() - hit.at < GET_TTL_MS) {
      return hit.data as T;
    }
    const pending = inflight.get(key);
    if (pending) return pending as Promise<T>;
  }

  const run = (async () => {
    const isForm =
      typeof FormData !== "undefined" && init?.body instanceof FormData;
    const res = await fetch(withBasePath(path), {
      ...init,
      headers: {
        Accept: "application/json",
        ...(init?.body && !isForm ? { "Content-Type": "application/json" } : {}),
        ...(init?.headers ?? {}),
      },
      credentials: "same-origin",
    });
    const text = await res.text();
    let data: unknown = null;
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = { error: text };
      }
    }
    if (!res.ok) {
      const body = data as { error?: string; code?: string } | null;
      throw new ApiError(
        res.status,
        body?.error || "خطایی رخ داد",
        body?.code,
      );
    }
    if (isGet) {
      memo.set(key, { at: Date.now(), data });
    }
    return data as T;
  })();

  if (isGet) {
    inflight.set(key, run);
    try {
      return await run;
    } finally {
      inflight.delete(key);
    }
  }

  return run;
}
