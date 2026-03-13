import { inngest } from "@/lib/inngest";
import { sendSubscriptionCanceledEmail } from "@/lib/email";

export const subscriptionCanceledFn = inngest.createFunction(
  { id: "subscription-canceled", retries: 3 },
  { event: "stripe/subscription.canceled" },
  async ({ event }) => {
    const { email, subscriptionId } = event.data;
    if (!email) return { skipped: true, reason: "no email" };

    await sendSubscriptionCanceledEmail(email);
    return { sent: true, email, subscriptionId };
  }
);
