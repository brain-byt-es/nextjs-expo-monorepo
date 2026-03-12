import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

// Lazy initialize Stripe client (only when needed)
let stripeClient: Stripe | null = null;

function getStripe() {
  if (!stripeClient && process.env.STRIPE_SECRET_KEY) {
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-02-24.acacia",
    });
  }
  return stripeClient;
}

// Lazy initialize Supabase client (only when needed)
let supabaseClient: ReturnType<typeof createClient> | null = null;

function getSupabase() {
  if (!supabaseClient && process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
  }
  return supabaseClient;
}

/**
 * POST /api/webhooks/stripe
 * Handle Stripe webhook events
 *
 * This endpoint receives events from Stripe:
 * - checkout.session.completed
 * - customer.subscription.updated
 * - customer.subscription.deleted
 * - invoice.payment_succeeded
 * - invoice.payment_failed
 */
export async function POST(request: NextRequest) {
  const stripe = getStripe();
  const supabase = getSupabase();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripe || !supabase || !webhookSecret) {
    return NextResponse.json(
      { error: "Stripe or Supabase is not configured" },
      { status: 500 }
    );
  }

  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    console.error("Webhook signature verification failed:", error);
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log("Checkout completed:", session.id);

        if (session.customer && session.subscription) {
          try {
            // Get customer email from Stripe
            const customer = await stripe.customers.retrieve(
              session.customer as string
            );

            // Update user subscription in Supabase
            const { error } = await (supabase as any)
              .from("user_subscriptions")
              .upsert(
                {
                  stripe_customer_id: session.customer as string,
                  stripe_subscription_id: session.subscription as string,
                  status: "active",
                  email: "deleted" in customer ? null : customer.email,
                  updated_at: new Date().toISOString(),
                },
                { onConflict: "stripe_customer_id" }
              );

            if (error) {
              console.error("Error updating subscription:", error);
            }
          } catch (err) {
            console.error("Error processing checkout session:", err);
          }
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        console.log("Subscription updated:", subscription.id);

        try {
          const { error } = await (supabase as any)
            .from("user_subscriptions")
            .update({
              status: subscription.status,
              updated_at: new Date().toISOString(),
            })
            .eq("stripe_subscription_id", subscription.id);

          if (error) {
            console.error("Error updating subscription status:", error);
          }
        } catch (err) {
          console.error("Error processing subscription update:", err);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        console.log("Subscription deleted:", subscription.id);

        try {
          const { error } = await (supabase as any)
            .from("user_subscriptions")
            .update({
              status: "canceled",
              canceled_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("stripe_subscription_id", subscription.id);

          if (error) {
            console.error("Error canceling subscription:", error);
          }
        } catch (err) {
          console.error("Error processing subscription deletion:", err);
        }
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        console.log("Invoice paid:", invoice.id);

        try {
          // Record payment in Supabase
          const { error } = await (supabase as any)
            .from("payments")
            .insert({
              stripe_invoice_id: invoice.id,
              stripe_subscription_id: invoice.subscription as string,
              amount: invoice.amount_paid,
              currency: invoice.currency,
              status: "paid",
              paid_at: new Date().toISOString(),
            });

          if (error) {
            console.error("Error recording payment:", error);
          }
        } catch (err) {
          console.error("Error processing payment succeeded:", err);
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        console.log("Invoice payment failed:", invoice.id);

        try {
          // Record failed payment in Supabase
          const { error } = await (supabase as any)
            .from("payments")
            .insert({
              stripe_invoice_id: invoice.id,
              stripe_subscription_id: invoice.subscription as string,
              amount: invoice.amount_due,
              currency: invoice.currency,
              status: "failed",
              failed_at: new Date().toISOString(),
            });

          if (error) {
            console.error("Error recording failed payment:", error);
          }

          // TODO: Send email notification to user about failed payment
        } catch (err) {
          console.error("Error processing payment failed:", err);
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook handler error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}
