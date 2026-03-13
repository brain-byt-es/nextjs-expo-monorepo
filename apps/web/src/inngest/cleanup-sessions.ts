import { inngest } from "@/lib/inngest";

export const cleanupSessionsFn = inngest.createFunction(
  { id: "cleanup-sessions" },
  { cron: "0 3 * * *" }, // Daily at 3 AM UTC
  async () => {
    // Cleanup expired sessions from Better-Auth
    // This will be expanded when Drizzle ORM is integrated
    console.log("Running session cleanup...");
    return { cleaned: true, timestamp: new Date().toISOString() };
  }
);
