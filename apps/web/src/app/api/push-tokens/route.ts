import { NextResponse } from "next/server";
import { getSession } from "@/app/api/_helpers/auth";
import { pushTokens } from "@repo/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(request: Request) {
  try {
    const result = await getSession();
    if ("error" in result) return result.error;
    const { session, db } = result;

    const body = await request.json();
    const { token, platform } = body as { token?: string; platform?: string };

    if (!token || typeof token !== "string") {
      return NextResponse.json({ error: "token is required" }, { status: 400 });
    }
    if (!platform || !["ios", "android"].includes(platform)) {
      return NextResponse.json(
        { error: "platform must be 'ios' or 'android'" },
        { status: 400 }
      );
    }

    // Upsert: insert or update on token conflict
    await db
      .insert(pushTokens)
      .values({
        userId: session.user.id,
        token,
        platform,
        isActive: true,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: pushTokens.token,
        set: {
          userId: session.user.id,
          isActive: true,
          updatedAt: new Date(),
        },
      });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[push-tokens POST]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const result = await getSession();
    if ("error" in result) return result.error;
    const { session, db } = result;

    const body = await request.json();
    const { token } = body as { token?: string };

    if (!token || typeof token !== "string") {
      return NextResponse.json({ error: "token is required" }, { status: 400 });
    }

    await db
      .update(pushTokens)
      .set({ isActive: false, updatedAt: new Date() })
      .where(
        and(
          eq(pushTokens.token, token),
          eq(pushTokens.userId, session.user.id)
        )
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[push-tokens DELETE]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
