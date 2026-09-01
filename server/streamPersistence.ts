import { and, desc, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { streamAnalytics, streamClips, streamSchedules } from "../drizzle/schema";
import { getDb } from "./db";

export function summarizeStreamAnalyticsRecords(records: Array<{
  status: "configured" | "stopped" | "failed";
  totalViewers: number;
  chatMessageCount: number;
  platformBreakdown: unknown;
}>) {
  const platformTotals: Record<string, number> = {};
  for (const record of records) {
    const breakdown = record.platformBreakdown as Record<string, number> | null;
    for (const [platform, viewers] of Object.entries(breakdown || {})) {
      platformTotals[platform] = (platformTotals[platform] || 0) + Number(viewers || 0);
    }
  }
  return {
    snapshots: records.length,
    configuredSessions: records.filter(record => record.status === "configured").length,
    peakViewers: records.reduce((peak, record) => Math.max(peak, record.totalViewers), 0),
    totalChatMessages: records.reduce((sum, record) => sum + record.chatMessageCount, 0),
    platformTotals,
    telemetryScope: "Session-management telemetry; real viewer polling requires connected platform APIs.",
  };
}

export async function createStreamSchedule(data: {
  userId: number;
  name: string;
  buildSessionId: string;
  cronExpression: string;
  integrationPublicIds: string[];
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const publicId = nanoid(16);
  await db.insert(streamSchedules).values({ ...data, publicId });
  return (await db.select().from(streamSchedules).where(eq(streamSchedules.publicId, publicId)).limit(1))[0];
}

export async function setStreamScheduleTaskUid(publicId: string, userId: number, taskUid: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(streamSchedules)
    .set({ scheduleCronTaskUid: taskUid })
    .where(and(eq(streamSchedules.publicId, publicId), eq(streamSchedules.userId, userId)));
}

export async function getStreamSchedule(publicId: string, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  return (await db.select().from(streamSchedules)
    .where(and(eq(streamSchedules.publicId, publicId), eq(streamSchedules.userId, userId))).limit(1))[0];
}

export async function getStreamScheduleByTaskUid(taskUid: string) {
  const db = await getDb();
  if (!db) return undefined;
  return (await db.select().from(streamSchedules)
    .where(eq(streamSchedules.scheduleCronTaskUid, taskUid)).limit(1))[0];
}

export async function listStreamSchedules(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(streamSchedules)
    .where(eq(streamSchedules.userId, userId)).orderBy(desc(streamSchedules.createdAt));
}

export async function updateStreamScheduleState(
  publicId: string,
  patch: Partial<{
    isEnabled: boolean;
    lastRunAt: Date;
    lastRunStatus: "never" | "configured" | "skipped" | "failed";
    lastSessionId: string | null;
    lastError: string | null;
  }>,
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(streamSchedules).set(patch).where(eq(streamSchedules.publicId, publicId));
}

export async function deleteStreamSchedule(publicId: string, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(streamSchedules)
    .where(and(eq(streamSchedules.publicId, publicId), eq(streamSchedules.userId, userId)));
}

export async function createStreamAnalyticsSnapshot(data: {
  userId: number;
  sessionId: string;
  buildSessionId: string;
  status: "configured" | "stopped" | "failed";
  destinationCount: number;
  totalViewers: number;
  platformBreakdown: Record<string, number>;
  chatMessageCount: number;
  startedAt?: Date;
  endedAt?: Date;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const publicId = nanoid(16);
  await db.insert(streamAnalytics).values({ ...data, publicId });
  return publicId;
}

export async function listStreamAnalytics(userId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(streamAnalytics)
    .where(eq(streamAnalytics.userId, userId))
    .orderBy(desc(streamAnalytics.createdAt))
    .limit(limit);
}

export async function createStreamClipMarker(data: {
  userId: number;
  sessionId: string;
  buildSessionId: string;
  title: string;
  startSeconds: number;
  endSeconds: number;
  platforms: string[];
  note?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const publicId = nanoid(16);
  await db.insert(streamClips).values({ ...data, publicId });
  return publicId;
}

export async function listStreamClips(userId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(streamClips)
    .where(eq(streamClips.userId, userId))
    .orderBy(desc(streamClips.createdAt))
    .limit(limit);
}
