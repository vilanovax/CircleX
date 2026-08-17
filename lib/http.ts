import { isDbUnreachable, prisma } from "@/lib/db";

export function jsonError(
  error: string,
  status: number,
  code?: string,
): Response {
  return Response.json(code ? { error, code } : { error }, { status });
}

export function dbUnavailable(): Response {
  return jsonError(
    "اتصال به سرور قطع شد. چند ثانیه دیگر دوباره باز کن",
    503,
    "db_unavailable",
  );
}

export async function withDb<T>(fn: () => Promise<T>): Promise<T | Response> {
  try {
    return await fn();
  } catch (err) {
    if (!isDbUnreachable(err)) throw err;
    await prisma.$disconnect().catch(() => {});
    try {
      return await fn();
    } catch (retryErr) {
      if (isDbUnreachable(retryErr)) return dbUnavailable();
      throw retryErr;
    }
  }
}

export async function readJson<T>(req: Request): Promise<T | null> {
  try {
    return (await req.json()) as T;
  } catch {
    return null;
  }
}
