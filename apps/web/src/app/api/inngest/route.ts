import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest";
import { sendWelcomeEmailFn } from "@/inngest/send-welcome-email";
import { paymentFailedReminderFn } from "@/inngest/payment-failed-reminder";
import { subscriptionCanceledFn } from "@/inngest/subscription-canceled";
import { cleanupSessionsFn } from "@/inngest/cleanup-sessions";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    sendWelcomeEmailFn,
    paymentFailedReminderFn,
    subscriptionCanceledFn,
    cleanupSessionsFn,
  ],
});
