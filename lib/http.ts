export function jsonError(
  error: string,
  status: number,
  code?: string,
): Response {
  return Response.json(code ? { error, code } : { error }, { status });
}

export async function readJson<T>(req: Request): Promise<T | null> {
  try {
    return (await req.json()) as T;
  } catch {
    return null;
  }
}
