/**
 * Audit Logging for Sensitive Operations
 * 
 * Tracks security-relevant operations for monitoring and compliance.
 */

import { getDb } from "../db";
import { auditLogs, type InsertAuditLog } from "../../drizzle/schema";
import crypto from "crypto";

// Action types
export type AuditAction = InsertAuditLog["action"];
export type EntityType = InsertAuditLog["entityType"];
export type AuditStatus = InsertAuditLog["status"];

interface AuditContext {
  userId?: number;
  userOpenId?: string;
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
}

interface AuditEntry {
  action: AuditAction;
  entityType?: EntityType;
  entityId?: number;
  entityPublicId?: string;
  details?: Record<string, unknown>;
  previousValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  status?: AuditStatus;
  errorMessage?: string;
}

/**
 * Generate a unique request ID for tracking
 */
export function generateRequestId(): string {
  return crypto.randomBytes(16).toString("hex");
}

/**
 * Create an audit context from Express request
 */
export function createAuditContext(req: {
  ip?: string;
  headers: Record<string, string | string[] | undefined>;
  user?: { id: number; openId: string };
}): AuditContext {
  const userAgent = req.headers["user-agent"];
  
  return {
    userId: req.user?.id,
    userOpenId: req.user?.openId,
    ipAddress: req.ip || getIpFromHeaders(req.headers),
    userAgent: Array.isArray(userAgent) ? userAgent[0] : userAgent,
    requestId: generateRequestId(),
  };
}

/**
 * Extract IP from headers
 */
function getIpFromHeaders(headers: Record<string, string | string[] | undefined>): string | undefined {
  const forwarded = headers["x-forwarded-for"];
  if (forwarded) {
    const ips = Array.isArray(forwarded) ? forwarded[0] : forwarded;
    return ips.split(",")[0].trim();
  }
  return undefined;
}

/**
 * Log an audit event
 */
export async function logAudit(
  context: AuditContext,
  entry: AuditEntry
): Promise<void> {
  try {
    const db = await getDb();
    if (!db) {
      console.warn("[Audit] Database not available, logging to console only");
      console.log("[Audit]", JSON.stringify({ context, entry }));
      return;
    }

    await db.insert(auditLogs).values({
      userId: context.userId,
      userOpenId: context.userOpenId,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId,
      entityPublicId: entry.entityPublicId,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      requestId: context.requestId,
      details: entry.details,
      previousValue: entry.previousValue,
      newValue: entry.newValue,
      status: entry.status || "success",
      errorMessage: entry.errorMessage,
    });

    // Also log to console for immediate visibility
    console.log(
      `[Audit] ${entry.action} by user:${context.userId || "anonymous"} ` +
      `on ${entry.entityType}:${entry.entityId || entry.entityPublicId || "N/A"} ` +
      `status:${entry.status || "success"} ip:${maskIp(context.ipAddress)}`
    );
  } catch (error) {
    // Never let audit logging failures break the main operation
    console.error("[Audit] Failed to log audit event:", error);
    console.log("[Audit] Fallback log:", JSON.stringify({ context, entry }));
  }
}

/**
 * Convenience functions for common audit events
 */
export const audit = {
  // API Key operations
  apiKeyCreated: (ctx: AuditContext, keyId: number, provider: string) =>
    logAudit(ctx, {
      action: "api_key_created",
      entityType: "api_key",
      entityId: keyId,
      details: { provider },
    }),

  apiKeyDeleted: (ctx: AuditContext, keyId: number, provider: string) =>
    logAudit(ctx, {
      action: "api_key_deleted",
      entityType: "api_key",
      entityId: keyId,
      details: { provider },
    }),

  apiKeyRotated: (ctx: AuditContext, keyId: number, provider: string) =>
    logAudit(ctx, {
      action: "api_key_rotated",
      entityType: "api_key",
      entityId: keyId,
      details: { provider },
    }),

  // Agent operations
  agentCreated: (ctx: AuditContext, agentId: number, agentPublicId: string, name: string) =>
    logAudit(ctx, {
      action: "agent_created",
      entityType: "agent",
      entityId: agentId,
      entityPublicId: agentPublicId,
      details: { name },
    }),

  agentDeleted: (ctx: AuditContext, agentId: number, agentPublicId: string, name: string) =>
    logAudit(ctx, {
      action: "agent_deleted",
      entityType: "agent",
      entityId: agentId,
      entityPublicId: agentPublicId,
      details: { name },
    }),

  agentTransferred: (
    ctx: AuditContext,
    agentId: number,
    agentPublicId: string,
    fromUserId: number,
    toUserId: number
  ) =>
    logAudit(ctx, {
      action: "agent_transferred",
      entityType: "agent",
      entityId: agentId,
      entityPublicId: agentPublicId,
      details: { fromUserId, toUserId },
    }),

  // External agent operations
  externalAgentRegistered: (ctx: AuditContext, agentId: number, publicId: string, name: string) =>
    logAudit(ctx, {
      action: "external_agent_registered",
      entityType: "external_agent",
      entityId: agentId,
      entityPublicId: publicId,
      details: { name },
    }),

  externalAgentVerified: (ctx: AuditContext, agentId: number, publicId: string) =>
    logAudit(ctx, {
      action: "external_agent_verified",
      entityType: "external_agent",
      entityId: agentId,
      entityPublicId: publicId,
    }),

  externalAgentClaimed: (ctx: AuditContext, agentId: number, publicId: string, claimedBy: number) =>
    logAudit(ctx, {
      action: "external_agent_claimed",
      entityType: "external_agent",
      entityId: agentId,
      entityPublicId: publicId,
      details: { claimedBy },
    }),

  externalAgentDeleted: (ctx: AuditContext, agentId: number, publicId: string) =>
    logAudit(ctx, {
      action: "external_agent_deleted",
      entityType: "external_agent",
      entityId: agentId,
      entityPublicId: publicId,
    }),

  // Webhook operations
  webhookCreated: (ctx: AuditContext, webhookId: number, url: string) =>
    logAudit(ctx, {
      action: "webhook_created",
      entityType: "webhook",
      entityId: webhookId,
      details: { url: maskUrl(url) },
    }),

  webhookDeleted: (ctx: AuditContext, webhookId: number) =>
    logAudit(ctx, {
      action: "webhook_deleted",
      entityType: "webhook",
      entityId: webhookId,
    }),

  webhookSecretRotated: (ctx: AuditContext, webhookId: number) =>
    logAudit(ctx, {
      action: "webhook_secret_rotated",
      entityType: "webhook",
      entityId: webhookId,
    }),

  // Authentication
  loginSuccess: (ctx: AuditContext, userId: number) =>
    logAudit(ctx, {
      action: "login_success",
      entityType: "user",
      entityId: userId,
    }),

  loginFailed: (ctx: AuditContext, reason: string) =>
    logAudit(ctx, {
      action: "login_failed",
      entityType: "user",
      status: "failure",
      errorMessage: reason,
    }),

  logout: (ctx: AuditContext, userId: number) =>
    logAudit(ctx, {
      action: "logout",
      entityType: "user",
      entityId: userId,
    }),

  ipBlocked: (ctx: AuditContext, reason: string, attemptCount: number) =>
    logAudit(ctx, {
      action: "ip_blocked",
      entityType: "system",
      details: { reason, attemptCount },
    }),

  ipUnblocked: (ctx: AuditContext, ip: string) =>
    logAudit(ctx, {
      action: "ip_unblocked",
      entityType: "system",
      details: { ip: maskIp(ip) },
    }),

  // Admin operations
  adminRoleGranted: (ctx: AuditContext, targetUserId: number) =>
    logAudit(ctx, {
      action: "admin_role_granted",
      entityType: "user",
      entityId: targetUserId,
    }),

  adminRoleRevoked: (ctx: AuditContext, targetUserId: number) =>
    logAudit(ctx, {
      action: "admin_role_revoked",
      entityType: "user",
      entityId: targetUserId,
    }),

  // Data operations
  dataExported: (ctx: AuditContext, dataType: string) =>
    logAudit(ctx, {
      action: "data_exported",
      entityType: "user",
      entityId: ctx.userId,
      details: { dataType },
    }),

  dataDeleted: (ctx: AuditContext, dataType: string, count: number) =>
    logAudit(ctx, {
      action: "data_deleted",
      entityType: "user",
      entityId: ctx.userId,
      details: { dataType, count },
    }),
};

/**
 * Mask IP address for logging
 */
function maskIp(ip?: string): string {
  if (!ip) return "unknown";
  if (ip.includes(":")) {
    const parts = ip.split(":");
    return parts.slice(0, 4).join(":") + ":****";
  }
  const parts = ip.split(".");
  return parts.slice(0, 2).join(".") + ".***";
}

/**
 * Mask URL for logging (hide sensitive parts)
 */
function maskUrl(url: string): string {
  try {
    const parsed = new URL(url);
    return `${parsed.protocol}//${parsed.host}${parsed.pathname}`;
  } catch {
    return url.slice(0, 50) + "...";
  }
}
