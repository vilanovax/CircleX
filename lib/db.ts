import { Prisma, PrismaClient } from "@prisma/client";

const RETRY_CODES = new Set(["P1001", "P1002", "P1017"]);

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

const UNREACHABLE_MSG =
  /Can't reach database server|Connection refused|ECONNREFUSED|ECONNRESET|ETIMEDOUT|EHOSTUNREACH|Server has closed the connection|timed out fetching a new connection|P1001|P1002|P1017/i;

function prismaErrFields(err: unknown): {
  code?: string;
  errorCode?: string;
  name?: string;
  message: string;
} {
  if (!err || typeof err !== "object") {
    return { message: String(err) };
  }
  const o = err as {
    code?: unknown;
    errorCode?: unknown;
    name?: unknown;
    message?: unknown;
  };
  return {
    code: typeof o.code === "string" ? o.code : undefined,
    errorCode: typeof o.errorCode === "string" ? o.errorCode : undefined,
    name: typeof o.name === "string" ? o.name : undefined,
    message: typeof o.message === "string" ? o.message : String(err),
  };
}

/** True when Postgres is down, asleep, or the TCP path is dead. */
export function isDbUnreachable(err: unknown): boolean {
  const f = prismaErrFields(err);
  const code = f.errorCode ?? f.code;
  if (code && RETRY_CODES.has(code)) return true;
  if (UNREACHABLE_MSG.test(f.message)) return true;
  if (
    err instanceof Prisma.PrismaClientInitializationError ||
    f.name === "PrismaClientInitializationError"
  ) {
    return true;
  }
  return false;
}
