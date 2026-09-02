import { Prisma, type AdminRole } from "@prisma/client";
import { cache } from "react";
import {
  enumerateTehranDays,
  faDayLabel,
  tehranDayKey,
  tehranMidnight,
} from "@/lib/admin-day";
import { DEFAULT_AUTH } from "@/lib/app-settings-types";
import { prisma } from "@/lib/db";
import { isObjectStorageConfigured } from "@/lib/object-storage";

const DASH_TTL_MS = 15_000;
const ANALYTICS_TTL_MS = 20_000;

export type AdminDayPoint = {
  day: string;
  label: string;
  users: number;
  listings: number;
  invites: number;
  accepts: number;
};

export type AdminDashboard = {
  stats: {
    users24h: number;
    users7d: number;
    usersIncomplete: number;
    invitesLive: number;
    invitesExpiredPending: number;
    inviteAcceptRate: number;
    invitesTotal: number;
    invitesAccepted: number;
    listings24h: number;
    requests24h: number;
    events24h: number;
    reportsOpen: number;
    otpLocked: number;
    sessionsActive: number;
    usersBanned: number;
    joinPending: number;
    listingsHidden: number;
    messageReportsOpen: number;
    feedbackOpen: number;
    watchesEnabled: number;
  };
  series: AdminDayPoint[];
  viewer: {
    role: AdminRole;
    canSeeUsers: boolean;
  };
  health: {
    smsConfigured: boolean;
    openaiConfigured: boolean;
    uploadDirReady: boolean;
    webhookConfigured: boolean;
  };
};

export type AdminAnalytics = {
  rangeDays: 7 | 14 | 30;
  series: AdminDayPoint[];
  funnel: {
    created: number;
    accepted: number;
    live: number;
    expired: number;
    revoked: number;
  };
  joins: {
    pending: number;
    accepted: number;
    rejected: number;
  };
  totals: {
    users: number;
    listings: number;
    invites: number;
    accepts: number;
  };
};

type DashCore = Omit<AdminDashboard, "viewer">;

type CountRow = {
  users24h: unknown;
  users7d: unknown;
  usersIncomplete: unknown;
  invitesLive: unknown;
  invitesExpiredPending: unknown;
  invitesTotal: unknown;
  invitesAccepted: unknown;
  listings24h: unknown;
  requests24h: unknown;
  events24h: unknown;
  reportsOpen: unknown;
  otpLocked: unknown;
  sessionsActive: unknown;
  usersBanned: unknown;
  joinPending: unknown;
  listingsHidden: unknown;
  messageReportsOpen: unknown;
  feedbackOpen: unknown;
  watchesEnabled: unknown;
};

type DayKindRow = { kind: string; day: string; n: unknown };

type FunnelRow = {
  created: unknown;
  accepted: unknown;
  live: unknown;
  expired: unknown;
  revoked: unknown;
};

type JoinRow = {
  pending: unknown;
  accepted: unknown;
  rejected: unknown;
};

type Memo<T> = { at: number; value: T };

const g = globalThis as typeof globalThis & {
  __circleAdminDash?: Memo<DashCore>;
  __circleAdminAnalytics?: Map<number, Memo<AdminAnalytics>>;
};

function tehranDaySql(column: "createdAt" | "acceptedAt"): Prisma.Sql {
  return Prisma.raw(
    `(timezone('Asia/Tehran', "${column}" AT TIME ZONE 'UTC'))::date::text`,
  );
}

function num(value: unknown): number {
  if (typeof value === "bigint") return Number(value);
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function readHealth(): AdminDashboard["health"] {
  return {
    smsConfigured: Boolean(process.env.KAVENEGAR_API_KEY?.trim()),
    openaiConfigured: Boolean(process.env.OPENAI_API_KEY?.trim()),
    uploadDirReady: isObjectStorageConfigured(),
    webhookConfigured: Boolean(process.env.ADMIN_WEBHOOK_URL?.trim()),
  };
}

function fillSeries(keys: string[], rows: DayKindRow[]): AdminDayPoint[] {
  const users = new Map<string, number>();
  const listings = new Map<string, number>();
  const invites = new Map<string, number>();
  const accepts = new Map<string, number>();
  for (const row of rows) {
    const n = num(row.n);
    if (row.kind === "users") users.set(row.day, n);
    else if (row.kind === "listings") listings.set(row.day, n);
    else if (row.kind === "invites") invites.set(row.day, n);
    else if (row.kind === "accepts") accepts.set(row.day, n);
  }
  return keys.map((day) => ({
    day,
    label: faDayLabel(day),
    users: users.get(day) ?? 0,
    listings: listings.get(day) ?? 0,
    invites: invites.get(day) ?? 0,
    accepts: accepts.get(day) ?? 0,
  }));
}

async function queryDaySeries(since: Date): Promise<DayKindRow[]> {
  const created = tehranDaySql("createdAt");
  const accepted = tehranDaySql("acceptedAt");
  return prisma.$queryRaw<DayKindRow[]>`
    SELECT 'users'::text AS kind, ${created} AS day, COUNT(*)::int AS n
    FROM "User"
    WHERE "createdAt" >= ${since}
    GROUP BY 2
    UNION ALL
    SELECT 'listings', ${created}, COUNT(*)::int
    FROM "MarketListing"
    WHERE "createdAt" >= ${since}
    GROUP BY 2
    UNION ALL
    SELECT 'invites', ${created}, COUNT(*)::int
    FROM "Invite"
    WHERE "createdAt" >= ${since}
    GROUP BY 2
    UNION ALL
    SELECT 'accepts', ${accepted}, COUNT(*)::int
    FROM "Invite"
    WHERE "acceptedAt" >= ${since}
    GROUP BY 2
  `;
}

async function queryDashboardCore(): Promise<DashCore> {
  const now = new Date();
  const h24 = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const d7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const keys = enumerateTehranDays(7);
  const weekStart = tehranMidnight(keys[0] ?? tehranDayKey(now));
  const otpDefault = DEFAULT_AUTH.otpMaxAttempts;

  const [countRows, seriesRows] = await Promise.all([
    prisma.$queryRaw<CountRow[]>`
      SELECT
        (SELECT COUNT(*)::int FROM "User" WHERE "createdAt" >= ${h24}) AS "users24h",
        (SELECT COUNT(*)::int FROM "User" WHERE "createdAt" >= ${d7}) AS "users7d",
        (SELECT COUNT(*)::int FROM "User" WHERE "profileCompletedAt" IS NULL) AS "usersIncomplete",
        (SELECT COUNT(*)::int FROM "Invite"
          WHERE status = 'pending' AND "expiresAt" > ${now}) AS "invitesLive",
        (SELECT COUNT(*)::int FROM "Invite"
          WHERE status = 'expired'
             OR (status = 'pending' AND "expiresAt" <= ${now})) AS "invitesExpiredPending",
        (SELECT COUNT(*)::int FROM "Invite") AS "invitesTotal",
        (SELECT COUNT(*)::int FROM "Invite" WHERE status = 'accepted') AS "invitesAccepted",
        (SELECT COUNT(*)::int FROM "MarketListing" WHERE "createdAt" >= ${h24}) AS "listings24h",
        (SELECT COUNT(*)::int FROM "WantRequest" WHERE "createdAt" >= ${h24}) AS "requests24h",
        (SELECT COUNT(*)::int FROM "Gathering" WHERE "createdAt" >= ${h24}) AS "events24h",
        (SELECT COUNT(*)::int FROM "ListingReport" WHERE status = 'open') AS "reportsOpen",
        (SELECT COUNT(*)::int FROM "OtpChallenge"
          WHERE attempts >= COALESCE(
            (SELECT NULLIF("auth"->>'otpMaxAttempts','')::int FROM "AppSetting" WHERE id = 'app'),
            ${otpDefault}
          )) AS "otpLocked",
        (SELECT COUNT(*)::int FROM "Session" WHERE "expiresAt" > ${now}) AS "sessionsActive",
        (SELECT COUNT(*)::int FROM "User"
          WHERE "bannedAt" IS NOT NULL
            AND ("bannedUntil" IS NULL OR "bannedUntil" > ${now})) AS "usersBanned",
        (SELECT COUNT(*)::int FROM "CircleJoinRequest" WHERE status = 'pending') AS "joinPending",
        (SELECT COUNT(*)::int FROM "MarketListing" WHERE "dealStatus" = 'inactive') AS "listingsHidden",
        (SELECT COUNT(*)::int FROM "MessageReport" WHERE status = 'open') AS "messageReportsOpen",
        (SELECT COUNT(*)::int FROM "AppFeedback" WHERE status = 'open') AS "feedbackOpen",
        (SELECT COUNT(*)::int FROM "ListingWatch" WHERE enabled = true) AS "watchesEnabled"
    `,
    queryDaySeries(weekStart),
  ]);

  const row = countRows[0];
  const invitesTotal = num(row?.invitesTotal);
  const invitesAccepted = num(row?.invitesAccepted);
  return {
    stats: {
      users24h: num(row?.users24h),
      users7d: num(row?.users7d),
      usersIncomplete: num(row?.usersIncomplete),
      invitesLive: num(row?.invitesLive),
      invitesExpiredPending: num(row?.invitesExpiredPending),
      inviteAcceptRate: invitesTotal === 0 ? 0 : invitesAccepted / invitesTotal,
      invitesTotal,
      invitesAccepted,
      listings24h: num(row?.listings24h),
      requests24h: num(row?.requests24h),
      events24h: num(row?.events24h),
      reportsOpen: num(row?.reportsOpen),
      otpLocked: num(row?.otpLocked),
      sessionsActive: num(row?.sessionsActive),
      usersBanned: num(row?.usersBanned),
      joinPending: num(row?.joinPending),
      listingsHidden: num(row?.listingsHidden),
      messageReportsOpen: num(row?.messageReportsOpen),
      feedbackOpen: num(row?.feedbackOpen),
      watchesEnabled: num(row?.watchesEnabled),
    },
    series: fillSeries(keys, seriesRows),
    health: readHealth(),
  };
}

async function loadDashboardCore(): Promise<DashCore> {
  const hit = g.__circleAdminDash;
  if (hit && Date.now() - hit.at < DASH_TTL_MS) return hit.value;
  const value = await queryDashboardCore();
  g.__circleAdminDash = { at: Date.now(), value };
  return value;
}

export async function loadAdminDashboard(role: AdminRole): Promise<AdminDashboard> {
  const core = await loadDashboardCore();
  return {
    ...core,
    viewer: {
      role,
      canSeeUsers: role !== "analyst",
    },
  };
}

async function queryAnalytics(days: 7 | 14 | 30): Promise<AdminAnalytics> {
  const keys = enumerateTehranDays(days);
  const since = tehranMidnight(keys[0] ?? tehranDayKey(new Date()));
  const now = new Date();
  const created = tehranDaySql("createdAt");
  const accepted = tehranDaySql("acceptedAt");

  const rows = await prisma.$queryRaw<
    { series: DayKindRow[] | null; funnel: FunnelRow | null; joins: JoinRow | null }[]
  >`
    SELECT
      (
        SELECT COALESCE(json_agg(row_to_json(s)), '[]'::json)
        FROM (
          SELECT 'users'::text AS kind, ${created} AS day, COUNT(*)::int AS n
          FROM "User"
          WHERE "createdAt" >= ${since}
          GROUP BY 2
          UNION ALL
          SELECT 'listings', ${created}, COUNT(*)::int
          FROM "MarketListing"
          WHERE "createdAt" >= ${since}
          GROUP BY 2
          UNION ALL
          SELECT 'invites', ${created}, COUNT(*)::int
          FROM "Invite"
          WHERE "createdAt" >= ${since}
          GROUP BY 2
          UNION ALL
          SELECT 'accepts', ${accepted}, COUNT(*)::int
          FROM "Invite"
          WHERE "acceptedAt" >= ${since}
          GROUP BY 2
        ) s
      ) AS series,
      (
        SELECT json_build_object(
          'created', COUNT(*)::int,
          'accepted', COUNT(*) FILTER (WHERE status = 'accepted')::int,
          'live', COUNT(*) FILTER (WHERE status = 'pending' AND "expiresAt" > ${now})::int,
          'expired', COUNT(*) FILTER (
            WHERE status = 'expired'
               OR (status = 'pending' AND "expiresAt" <= ${now})
          )::int,
          'revoked', COUNT(*) FILTER (WHERE status = 'revoked')::int
        )
        FROM "Invite"
        WHERE "createdAt" >= ${since}
      ) AS funnel,
      json_build_object(
        'pending', (SELECT COUNT(*)::int FROM "CircleJoinRequest" WHERE status = 'pending'),
        'accepted', (SELECT COUNT(*)::int FROM "CircleJoinRequest"
          WHERE status = 'accepted' AND "resolvedAt" >= ${since}),
        'rejected', (SELECT COUNT(*)::int FROM "CircleJoinRequest"
          WHERE status = 'rejected' AND "resolvedAt" >= ${since})
      ) AS joins
  `;

  const row = rows[0];
  const series = fillSeries(keys, Array.isArray(row?.series) ? row.series : []);
  const funnel = row?.funnel;
  const joins = row?.joins;
  return {
    rangeDays: days,
    series,
    funnel: {
      created: num(funnel?.created),
      accepted: num(funnel?.accepted),
      live: num(funnel?.live),
      expired: num(funnel?.expired),
      revoked: num(funnel?.revoked),
    },
    joins: {
      pending: num(joins?.pending),
      accepted: num(joins?.accepted),
      rejected: num(joins?.rejected),
    },
    totals: {
      users: series.reduce((sum, point) => sum + point.users, 0),
      listings: series.reduce((sum, point) => sum + point.listings, 0),
      invites: series.reduce((sum, point) => sum + point.invites, 0),
      accepts: series.reduce((sum, point) => sum + point.accepts, 0),
    },
  };
}

export const loadAdminAnalytics = cache(async (
  days: 7 | 14 | 30,
): Promise<AdminAnalytics> => {
  const map = (g.__circleAdminAnalytics ??= new Map());
  const hit = map.get(days);
  if (hit && Date.now() - hit.at < ANALYTICS_TTL_MS) return hit.value;
  const value = await queryAnalytics(days);
  map.set(days, { at: Date.now(), value });
  return value;
});

