import { inngest } from "@/lib/inngest";
import { sendWelcomeEmail } from "@/lib/email";

export const sendWelcomeEmailFn = inngest.createFunction(
  { id: "send-welcome-email", retries: 3 },
  { event: "user/signup" },
  async ({ event }) => {
    const { name, email } = event.data;
    await sendWelcomeEmail(name, email);
    return { sent: true, email };
  }
);
