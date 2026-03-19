import { getDb } from "@repo/db";
import { auditLog } from "@repo/db/schema";

export interface AuditParams {
  orgId: string;
  objectType: string;
  objectId: string;
  userId: string;
  field: string;
  oldValue: string | null;
  newValue: string | null;
}

/**
 * Write a single audit log entry. Errors are swallowed so that a logging
 * failure never blocks the calling business operation.
 */
export async function logAudit(params: AuditParams): Promise<void> {
  try {
    const db = getDb();
    await db.insert(auditLog).values({
      organizationId: params.orgId,
      objectType: params.objectType,
      objectId: params.objectId,
      userId: params.userId,
      field: params.field,
      oldValue: params.oldValue,
      newValue: params.newValue,
    });
  } catch (err) {
    console.error("[audit] Failed to write audit log entry:", err);
  }
}

/**
 * Write multiple audit log entries in a single INSERT.
 */
export async function logAuditBatch(entries: AuditParams[]): Promise<void> {
  if (entries.length === 0) return;
  try {
    const db = getDb();
    await db.insert(auditLog).values(
      entries.map((e) => ({
        organizationId: e.orgId,
        objectType: e.objectType,
        objectId: e.objectId,
        userId: e.userId,
        field: e.field,
        oldValue: e.oldValue,
        newValue: e.newValue,
      }))
    );
  } catch (err) {
    console.error("[audit] Failed to write audit log batch:", err);
  }
}
