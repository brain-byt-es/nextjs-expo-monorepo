import { inngest } from "@/lib/inngest";
import { sendPaymentFailedEmail } from "@/lib/email";

export const paymentFailedReminderFn = inngest.createFunction(
  { id: "payment-failed-reminder", retries: 3 },
  { event: "stripe/payment.failed" },
  async ({ event }) => {
    const { email, invoiceId } = event.data;
    if (!email) return { skipped: true, reason: "no email" };

    await sendPaymentFailedEmail(email);
    return { sent: true, email, invoiceId };
  }
);
