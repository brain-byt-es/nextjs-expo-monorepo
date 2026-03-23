import { NextResponse } from "next/server";
import { getSessionAndOrg } from "@/app/api/_helpers/auth";
import { scanDeliveryNote } from "@/lib/ai-vision-router";
import type { ScanResult, DeliveryLineItem } from "@/lib/ai-vision-router";
import { getOrgAiConfig } from "@/lib/get-org-ai-key";
import { lookupEan } from "@/lib/ean-lookup";
import type { EanResult } from "@/lib/ean-lookup";
import { materials } from "@repo/db/schema";
import { eq, and, ilike } from "drizzle-orm";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_BYTES = 10 * 1024 * 1024; // ~10 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const EAN_TIMEOUT_MS = 5_000;

const DEMO_RESULT: ScanResult = {
  supplierName: "Hilti (Schweiz) AG",
  deliveryNoteNumber: "LS-2026-00481",
  deliveryDate: "2026-03-23",
  items: [
    { position: 1, name: "Hilti HIT-HY 200-A Injektionsmörtel 330ml", quantity: 12, unit: "Stk", ean: "3838782018565", articleNumber: "2123407", notes: null },
    { position: 2, name: "Hilti S-BT-MR Gewindebolzen M10x25", quantity: 200, unit: "Stk", ean: null, articleNumber: "387081", notes: null },
    { position: 3, name: "Bosch Professional Akku-Schlagschrauber GDS 18V-1050", quantity: 2, unit: "Stk", ean: "3165140953160", articleNumber: null, notes: null },
    { position: 4, name: "Fischer DuoPower 10x50 S Dübel mit Schraube", quantity: 500, unit: "Stk", ean: "4006209459867", articleNumber: "540100", notes: null },
    { position: 5, name: "3M Scotch-Weld DP 490 Klebstoff 50ml", quantity: 6, unit: "Stk", ean: "4054596071988", articleNumber: null, notes: null },
  ],
  rawText: null,
  provider: "demo",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface MaterialMatch {
  materialId: string;
  materialName: string;
  barcode: string | null;
  confidence: "barcode" | "name";
}

async function findMaterialMatch(
  item: DeliveryLineItem,
  orgId: string,
  db: ReturnType<typeof import("@repo/db").getDb>
): Promise<MaterialMatch | null> {
  // 1. Try barcode match (highest confidence)
  if (item.ean) {
    const [byBarcode] = await db
      .select({ id: materials.id, name: materials.name, barcode: materials.barcode })
      .from(materials)
      .where(
        and(
          eq(materials.organizationId, orgId),
          eq(materials.isActive, true),
          eq(materials.barcode, item.ean)
        )
      )
      .limit(1);

    if (byBarcode) {
      return {
        materialId: byBarcode.id,
        materialName: byBarcode.name,
        barcode: byBarcode.barcode,
        confidence: "barcode",
      };
    }
  }

  // 2. Try fuzzy name match
  if (item.name) {
    // Use first 3 significant words for matching
    const words = item.name
      .split(/\s+/)
      .filter((w) => w.length > 2)
      .slice(0, 3);

    if (words.length > 0) {
      const nameConditions = words.map((w) => ilike(materials.name, `%${w}%`));

      const [byName] = await db
        .select({ id: materials.id, name: materials.name, barcode: materials.barcode })
        .from(materials)
        .where(
          and(
            eq(materials.organizationId, orgId),
            eq(materials.isActive, true),
            ...nameConditions
          )
        )
        .limit(1);

      if (byName) {
        return {
          materialId: byName.id,
          materialName: byName.name,
          barcode: byName.barcode,
          confidence: "name",
        };
      }
    }
  }

  return null;
}

async function lookupEanWithTimeout(ean: string): Promise<EanResult | null> {
  return Promise.race([
    lookupEan(ean),
    new Promise<null>((resolve) => setTimeout(() => resolve(null), EAN_TIMEOUT_MS)),
  ]);
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function POST(request: Request) {
  try {
    // Auth guard
    const result = await getSessionAndOrg(request);
    if (result.error) return result.error;
    const { orgId, db } = result;

    // Parse body (JSON with base64 image)
    let body: { image?: string; mimeType?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const { image, mimeType } = body;

    // Validate image
    if (!image || typeof image !== "string") {
      return NextResponse.json(
        { error: "Field 'image' (base64 string) is required" },
        { status: 400 }
      );
    }

    // Validate mimeType
    if (!mimeType || !ALLOWED_TYPES.includes(mimeType)) {
      return NextResponse.json(
        { error: "mimeType must be image/jpeg, image/png, or image/webp" },
        { status: 415 }
      );
    }

    // Validate size (~10 MB base64 ≈ 13.3 MB string)
    const estimatedBytes = (image.length * 3) / 4;
    if (estimatedBytes > MAX_BYTES) {
      return NextResponse.json(
        { error: "Image must be smaller than 10 MB" },
        { status: 413 }
      );
    }

    // Validate base64 format
    if (!/^[A-Za-z0-9+/=]+$/.test(image.slice(0, 100))) {
      return NextResponse.json(
        { error: "Image must be a valid base64 string (no data URI prefix)" },
        { status: 400 }
      );
    }

    // Get AI config for organization
    const aiConfig = await getOrgAiConfig(orgId, db);

    // Demo mode: no API key configured
    if (!aiConfig) {
      await new Promise((r) => setTimeout(r, 1200));
      return NextResponse.json({
        success: true,
        result: DEMO_RESULT,
        enrichments: [],
        matches: [],
        demo: true,
      });
    }

    // Call AI vision
    const scanResult = await scanDeliveryNote(
      image,
      mimeType,
      aiConfig.provider,
      aiConfig.apiKey
    );

    // EAN enrichment + material matching (in parallel per item)
    const enrichments: Array<{ position: number; ean: string; data: EanResult | null }> = [];
    const matches: Array<{ position: number; match: MaterialMatch | null }> = [];

    const itemPromises = scanResult.items.map(async (item) => {
      // EAN enrichment
      let eanData: EanResult | null = null;
      if (item.ean) {
        eanData = await lookupEanWithTimeout(item.ean);
        enrichments.push({ position: item.position, ean: item.ean, data: eanData });
      }

      // Material matching
      const match = await findMaterialMatch(item, orgId, db);
      matches.push({ position: item.position, match });
    });

    await Promise.allSettled(itemPromises);

    // Sort by position for consistent output
    enrichments.sort((a, b) => a.position - b.position);
    matches.sort((a, b) => a.position - b.position);

    return NextResponse.json({
      success: true,
      result: scanResult,
      enrichments,
      matches,
      demo: false,
    });
  } catch (error) {
    console.error("POST /api/deliveries/scan error:", error);

    // Fallback to demo result on error
    return NextResponse.json(
      {
        success: true,
        result: DEMO_RESULT,
        enrichments: [],
        matches: [],
        demo: true,
        fallback: true,
      },
      { status: 200 }
    );
  }
}
