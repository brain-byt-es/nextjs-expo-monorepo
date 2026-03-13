import { describe, it, expect, vi, beforeEach } from "vitest";
import type { NextRequest } from "next/server";

// Mock dependencies before imports
const mockLimit = vi.fn().mockResolvedValue({ success: true });
const mockCheckoutCreate = vi.fn().mockResolvedValue({
  id: "cs_test_123",
  url: "https://checkout.stripe.com/session/cs_test_123",
});

vi.mock("@upstash/ratelimit", () => ({
  Ratelimit: class {
    static slidingWindow() {
      return {};
    }
    limit = mockLimit;
  },
}));

vi.mock("@upstash/redis", () => ({
  Redis: class {},
}));

vi.mock("stripe", () => {
  return {
    default: class MockStripe {
      checkout = {
        sessions: { create: mockCheckoutCreate },
      };
    },
  };
});

vi.mock("@sentry/nextjs", () => ({
  captureException: vi.fn(),
}));

const mockGetSession = vi.fn();
vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession: (...args: unknown[]) => mockGetSession(...args) } },
}));

process.env.STRIPE_SECRET_KEY = "sk_test_fake";
process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3003";

const { POST } = await import("@/app/api/checkout/route");

function makeRequest(body: Record<string, unknown>) {
  return new Request("http://localhost:3003/api/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/checkout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLimit.mockResolvedValue({ success: true });
  });

  it("returns 401 if user is not authenticated", async () => {
    mockGetSession.mockResolvedValue(null);

    const res = await POST(makeRequest({ priceId: "price_123" }) as unknown as NextRequest);
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.error).toBe("User not authenticated");
  });

  it("returns 429 if rate limited", async () => {
    mockGetSession.mockResolvedValue({ user: { id: "u1", email: "a@b.com" } });
    mockLimit.mockResolvedValue({ success: false });

    const res = await POST(makeRequest({ priceId: "price_123" }) as unknown as NextRequest);
    const json = await res.json();

    expect(res.status).toBe(429);
    expect(json.error).toContain("Too many requests");
  });

  it("returns 400 if priceId is missing", async () => {
    mockGetSession.mockResolvedValue({ user: { id: "u1", email: "a@b.com" } });

    const res = await POST(makeRequest({}) as unknown as NextRequest);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toBe("Price ID is required");
  });

  it("creates checkout session and returns url", async () => {
    mockGetSession.mockResolvedValue({ user: { id: "u1", email: "test@example.com" } });

    const res = await POST(makeRequest({ priceId: "price_pro" }) as unknown as NextRequest);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.sessionId).toBe("cs_test_123");
    expect(json.url).toBe("https://checkout.stripe.com/session/cs_test_123");

    expect(mockCheckoutCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: "subscription",
        line_items: [{ price: "price_pro", quantity: 1 }],
        customer_email: "test@example.com",
        metadata: { userId: "u1" },
      })
    );
  });
});
