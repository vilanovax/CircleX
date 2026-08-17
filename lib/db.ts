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

export function isDbUnreachable(err: unknown): boolean {
  if (
    err instanceof Prisma.PrismaClientKnownRequestError &&
    RETRY_CODES.has(err.code)
  ) {
    return true;
  }
  if (
    err instanceof Prisma.PrismaClientInitializationError &&
    err.errorCode &&
    RETRY_CODES.has(err.errorCode)
  ) {
    return true;
  }
  return false;
}
