import { NextResponse } from "next/server";
import { getSessionAndOrg } from "@/app/api/_helpers/auth";
import { userSubscriptions } from "@repo/db/schema";
import { eq } from "drizzle-orm";
import { stripePlanIdToPlanId, getPlanDisplayName, type PlanId } from "@/lib/plans";

// Demo account email — always returns "enterprise" plan (show all features in demos)
const DEMO_EMAIL = "demo@logistikapp.ch";

// ─── GET /api/subscription/status ────────────────────────────────────────────
// Returns the current plan for the authenticated user's organization.

export async function GET(request: Request) {
  try {
    const result = await getSessionAndOrg(request);
    if (result.error) return result.error;
    const { session, db } = result;

    const email = session.user.email;

    // Demo account: always enterprise (show all features at trade fairs etc.)
    if (email === DEMO_EMAIL) {
      return NextResponse.json({
        planId: "enterprise" as PlanId,
        planName: getPlanDisplayName("enterprise"),
        status: "active",
        expiresAt: null,
      });
    }

    // Look up user_subscriptions for this user
    const [subscription] = await db
      .select({
        status: userSubscriptions.status,
        planId: userSubscriptions.planId,
      })
      .from(userSubscriptions)
      .where(eq(userSubscriptions.userId, session.user.id))
      .limit(1);

    if (!subscription || subscription.status !== "active") {
      // No active subscription: default to starter (free tier)
      return NextResponse.json({
        planId: "starter" as PlanId,
        planName: getPlanDisplayName("starter"),
        status: subscription?.status ?? "none",
        expiresAt: null,
      });
    }

    const planId = stripePlanIdToPlanId(subscription.planId);

    return NextResponse.json({
      planId,
      planName: getPlanDisplayName(planId),
      status: subscription.status,
      expiresAt: null,
    });
  } catch (error) {
    console.error("Error fetching subscription status:", error);
    // Fail open: return starter
    return NextResponse.json({
      planId: "starter" as PlanId,
      planName: getPlanDisplayName("starter"),
      status: "error",
      expiresAt: null,
    });
  }
}
