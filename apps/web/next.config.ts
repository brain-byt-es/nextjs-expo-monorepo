import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  reactCompiler: true,

  // Vercel Skew Protection — ensures clients on old deployments
  // get routed to the correct version during rollouts
  deploymentId: process.env.VERCEL_DEPLOYMENT_ID,
};

export default withNextIntl(nextConfig);
