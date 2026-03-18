import { NextResponse } from "next/server";
import { getSessionAndOrg } from "@/app/api/_helpers/auth";
import { materials } from "@repo/db/schema";

const MAX_BULK_ITEMS = 500;

interface MaterialInput {
  name: string;
  number?: string;
  unit?: string;
  barcode?: string;
  groupId?: string;
  mainLocationId?: string;
  manufacturer?: string;
  manufacturerNumber?: string;
  reorderLevel?: number;
  notes?: string;
  image?: string;
}

export async function POST(request: Request) {
  try {
    const result = await getSessionAndOrg(request);
    if (result.error) return result.error;
    const { db, orgId } = result;

    const body = await request.json();
    const { materials: items } = body as { materials: MaterialInput[] };

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Body must contain a non-empty 'materials' array" },
        { status: 400 }
      );
    }

    if (items.length > MAX_BULK_ITEMS) {
      return NextResponse.json(
        { error: `Maximum ${MAX_BULK_ITEMS} items per request` },
        { status: 400 }
      );
    }

    // Validate each item — every entry must have a non-empty name
    const invalid = items
      .map((item, i) => ({ item, i }))
      .filter(({ item }) => !item.name || typeof item.name !== "string" || item.name.trim() === "");

    if (invalid.length > 0) {
      const indices = invalid.map(({ i }) => i).join(", ");
      return NextResponse.json(
        { error: `Items at index [${indices}] are missing a required 'name' field` },
        { status: 400 }
      );
    }

    const rows = items.map((item) => ({
      organizationId: orgId,
      name: item.name.trim(),
      number: item.number ?? null,
      unit: item.unit ?? "Stk",
      barcode: item.barcode ?? null,
      groupId: item.groupId ?? null,
      mainLocationId: item.mainLocationId ?? null,
      manufacturer: item.manufacturer ?? null,
      manufacturerNumber: item.manufacturerNumber ?? null,
      reorderLevel: item.reorderLevel ?? 0,
      notes: item.notes ?? null,
      image: item.image ?? null,
    }));

    const created = await db
      .insert(materials)
      .values(rows)
      .returning({ id: materials.id, name: materials.name, number: materials.number });

    return NextResponse.json(
      { created: created.length, materials: created },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/materials/bulk error:", error);
    return NextResponse.json(
      { error: "Bulk import failed" },
      { status: 500 }
    );
  }
}
