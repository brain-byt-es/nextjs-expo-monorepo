import { NextResponse } from "next/server";
import { tools } from "@repo/db/schema";
import { and, eq, inArray } from "drizzle-orm";
import { withPermission } from "@/lib/rbac";

const MAX_IDS = 500;

// ─── DELETE /api/tools/bulk-delete ───────────────────────────────────────────
// Body: { ids: string[] }
// Soft-deletes (isActive = false) all matching tools.

export const DELETE = withPermission("tools", "delete")(async (request, { db, orgId }) => {
  try {
    const body = await request.json();
    const { ids } = body as { ids: string[] };

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "ids must be a non-empty array" }, { status: 400 });
    }

    if (ids.length > MAX_IDS) {
      return NextResponse.json(
        { error: `Maximum ${MAX_IDS} items per request` },
        { status: 400 }
      );
    }

    const deleted = await db
      .update(tools)
      .set({ isActive: false, updatedAt: new Date() })
      .where(
        and(
          eq(tools.organizationId, orgId),
          inArray(tools.id, ids),
          eq(tools.isActive, true)
        )
      )
      .returning({ id: tools.id, name: tools.name });

    return NextResponse.json({ deleted: deleted.length, ids: deleted.map((r) => r.id) });
  } catch (error) {
    console.error("DELETE /api/tools/bulk-delete error:", error);
    return NextResponse.json({ error: "Bulk delete failed" }, { status: 500 });
  }
});
