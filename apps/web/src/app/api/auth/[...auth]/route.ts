import { NextRequest, NextResponse } from "next/server";
import { DEMO_MODE } from "@/lib/demo-mode";

function demoHandler() {
  return NextResponse.json(
    { error: "Auth API is disabled in demo mode" },
    { status: 404 }
  );
}

// In demo mode, return stubs so the auth backend (which needs DB) is never initialized.
// In real mode, delegate to Better-Auth as usual.
let handlers: { POST: (req: NextRequest) => unknown; GET: (req: NextRequest) => unknown };

if (DEMO_MODE) {
  handlers = { POST: demoHandler, GET: demoHandler };
} else {
  // Dynamic import to avoid pulling in DB dependencies in demo mode
  const { auth } = require("@/lib/auth");
  const { toNextJsHandler } = require("better-auth/next-js");
  handlers = toNextJsHandler(auth);
}

export const { POST, GET } = handlers;
