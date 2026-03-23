// ─── Multi-Provider Vision Router ──────────────────────────────────────────
// Sends delivery note images to OpenAI, Anthropic or Gemini for structured
// extraction. Each provider receives the same system prompt and returns the
// same ScanResult shape.

export interface DeliveryLineItem {
  position: number;
  name: string;
  quantity: number;
  unit: string;
  ean: string | null;
  articleNumber: string | null;
  notes: string | null;
}

export interface ScanResult {
  supplierName: string | null;
  deliveryNoteNumber: string | null;
  deliveryDate: string | null;
  items: DeliveryLineItem[];
  rawText: string | null;
  provider: string;
}

type AiProvider = "openai" | "anthropic" | "gemini";

const SYSTEM_PROMPT = `You are a document scanner specializing in delivery notes (Lieferscheine).
Analyze this image of a delivery note and extract all product line items.
Return ONLY a JSON object with: supplierName, deliveryNoteNumber, deliveryDate, items[{position, name, quantity, unit, ean, articleNumber, notes}]
Rules: Extract EVERY line item. quantity must be a number. unit: German abbreviations (Stk, m, kg, l, Pkg). Include EAN if visible. Use null for unclear fields.`;

const TIMEOUT_MS = 60_000;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function scanDeliveryNote(
  base64Image: string,
  mimeType: string,
  provider: AiProvider,
  apiKey: string
): Promise<ScanResult> {
  switch (provider) {
    case "openai":
      return scanWithOpenAI(base64Image, mimeType, apiKey);
    case "anthropic":
      return scanWithAnthropic(base64Image, mimeType, apiKey);
    case "gemini":
      return scanWithGemini(base64Image, mimeType, apiKey);
  }
}

// ---------------------------------------------------------------------------
// OpenAI — GPT-4o with vision
// ---------------------------------------------------------------------------

async function scanWithOpenAI(
  base64Image: string,
  mimeType: string,
  apiKey: string
): Promise<ScanResult> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${base64Image}`,
              },
            },
            {
              type: "text",
              text: "Scan this delivery note.",
            },
          ],
        },
      ],
      max_tokens: 4096,
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`OpenAI API error ${response.status}: ${body}`);
  }

  const data = await response.json();
  const rawText: string = data.choices?.[0]?.message?.content ?? "";
  return toScanResult(safeParseJSON(rawText), rawText, "openai");
}

// ---------------------------------------------------------------------------
// Anthropic — Claude Sonnet with vision
// ---------------------------------------------------------------------------

async function scanWithAnthropic(
  base64Image: string,
  mimeType: string,
  apiKey: string
): Promise<ScanResult> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mimeType,
                data: base64Image,
              },
            },
            {
              type: "text",
              text: "Scan this delivery note.",
            },
          ],
        },
      ],
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Anthropic API error ${response.status}: ${body}`);
  }

  const data = await response.json();
  const rawText: string =
    data.content?.find((b: { type: string }) => b.type === "text")?.text ?? "";
  return toScanResult(safeParseJSON(rawText), rawText, "anthropic");
}

// ---------------------------------------------------------------------------
// Gemini — Gemini 2.0 Flash with vision
// ---------------------------------------------------------------------------

async function scanWithGemini(
  base64Image: string,
  mimeType: string,
  apiKey: string
): Promise<ScanResult> {
  const url = `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: SYSTEM_PROMPT }],
      },
      contents: [
        {
          parts: [
            {
              inlineData: {
                mimeType,
                data: base64Image,
              },
            },
            {
              text: "Scan this delivery note.",
            },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
        maxOutputTokens: 4096,
      },
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Gemini API error ${response.status}: ${body}`);
  }

  const data = await response.json();
  const rawText: string =
    data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  return toScanResult(safeParseJSON(rawText), rawText, "gemini");
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Extract a string or null from an unknown value.
 */
function str(val: unknown): string | null {
  return typeof val === "string" ? val : null;
}

/**
 * Build a ScanResult from parsed JSON + provider name.
 */
function toScanResult(
  parsed: Record<string, unknown>,
  rawText: string,
  provider: string
): ScanResult {
  return {
    supplierName: str(parsed.supplierName),
    deliveryNoteNumber: str(parsed.deliveryNoteNumber),
    deliveryDate: str(parsed.deliveryDate),
    items: normalizeItems(parsed.items),
    rawText,
    provider,
  };
}

/**
 * Safely parse a JSON string that may be wrapped in markdown code fences.
 */
function safeParseJSON(text: string): Record<string, unknown> {
  if (!text) return {};

  // Strip markdown code fences if present
  let cleaned = text.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");
  }

  try {
    return JSON.parse(cleaned);
  } catch {
    // Try to extract JSON object from surrounding text
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        return {};
      }
    }
    return {};
  }
}

/**
 * Normalize and validate item array from parsed AI response.
 */
function normalizeItems(raw: unknown): DeliveryLineItem[] {
  if (!Array.isArray(raw)) return [];

  return raw.map((item: Record<string, unknown>, idx: number) => ({
    position: typeof item.position === "number" ? item.position : idx + 1,
    name: String(item.name ?? ""),
    quantity: typeof item.quantity === "number" ? item.quantity : Number(item.quantity) || 0,
    unit: String(item.unit ?? "Stk"),
    ean: item.ean ? String(item.ean) : null,
    articleNumber: item.articleNumber ? String(item.articleNumber) : null,
    notes: item.notes ? String(item.notes) : null,
  }));
}
