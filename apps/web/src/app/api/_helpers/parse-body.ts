import { NextResponse } from "next/server";

export async function parseJsonBody<T = Record<string, unknown>>(
  request: Request
): Promise<{ data: T } | { error: Response }> {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return {
      error: NextResponse.json(
        { error: "Content-Type must be application/json" },
        { status: 415 }
      ),
    };
  }

  try {
    const data = (await request.json()) as T;
    return { data };
  } catch {
    return {
      error: NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }),
    };
  }
}
