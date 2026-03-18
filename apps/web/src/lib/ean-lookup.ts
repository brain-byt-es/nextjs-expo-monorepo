import { getDb } from "@repo/db";
import { eanCache } from "@repo/db/schema";
import { eq } from "drizzle-orm";

export interface EanResult {
  barcode: string;
  name: string | null;
  manufacturer: string | null;
  description: string | null;
  imageUrl: string | null;
  category: string | null;
  source: string;
}

/**
 * Look up product data for an EAN/GTIN barcode.
 *
 * Resolution order:
 *   1. Local ean_cache table (no external call)
 *   2. Open Food Facts (free, no API key required)
 *   3. Open GTIN DB (free, requires OPENGTINDB_API_KEY)
 *
 * Returns null when no source has data for the barcode.
 */
export async function lookupEan(barcode: string): Promise<EanResult | null> {
  const cached = await checkCache(barcode);
  if (cached) return cached;

  const off = await queryOpenFoodFacts(barcode);
  if (off) {
    await saveToCache(barcode, off);
    return off;
  }

  const gtindb = await queryOpenGtinDb(barcode);
  if (gtindb) {
    await saveToCache(barcode, gtindb);
    return gtindb;
  }

  return null;
}

// ─── Cache ───────────────────────────────────────────────────────────

async function checkCache(barcode: string): Promise<EanResult | null> {
  try {
    const db = getDb();
    const [row] = await db
      .select()
      .from(eanCache)
      .where(eq(eanCache.barcode, barcode))
      .limit(1);

    if (!row) return null;

    return {
      barcode: row.barcode,
      name: row.name,
      manufacturer: row.manufacturer,
      description: row.description,
      imageUrl: row.imageUrl,
      category: row.category,
      source: "cache",
    };
  } catch {
    // Cache miss — fall through to external sources
    return null;
  }
}

async function saveToCache(barcode: string, result: EanResult): Promise<void> {
  try {
    const db = getDb();
    await db
      .insert(eanCache)
      .values({
        barcode,
        name: result.name,
        manufacturer: result.manufacturer,
        description: result.description,
        imageUrl: result.imageUrl,
        category: result.category,
        source: result.source,
      })
      .onConflictDoUpdate({
        target: eanCache.barcode,
        set: {
          name: result.name,
          manufacturer: result.manufacturer,
          description: result.description,
          imageUrl: result.imageUrl,
          category: result.category,
          source: result.source,
          updatedAt: new Date(),
        },
      });
  } catch {
    // Non-fatal — proceed without caching
  }
}

// ─── Open Food Facts ─────────────────────────────────────────────────

async function queryOpenFoodFacts(barcode: string): Promise<EanResult | null> {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 5000);

    let res: Response;
    try {
      res = await fetch(
        `https://world.openfoodfacts.org/api/v2/product/${barcode}.json`,
        { signal: ctrl.signal }
      );
    } finally {
      clearTimeout(timer);
    }

    if (!res.ok) return null;

    const data = (await res.json()) as {
      status: number;
      product?: {
        product_name?: string;
        product_name_de?: string;
        brands?: string;
        generic_name?: string;
        generic_name_de?: string;
        image_url?: string;
        image_front_url?: string;
        categories?: string;
      };
    };

    if (data.status !== 1 || !data.product) return null;

    const p = data.product;
    return {
      barcode,
      name: p.product_name || p.product_name_de || null,
      manufacturer: p.brands || null,
      description: p.generic_name || p.generic_name_de || null,
      imageUrl: p.image_url || p.image_front_url || null,
      category: p.categories || null,
      source: "openfoodfacts",
    };
  } catch {
    return null;
  }
}

// ─── Open GTIN DB ────────────────────────────────────────────────────

async function queryOpenGtinDb(barcode: string): Promise<EanResult | null> {
  const apiKey = process.env.OPENGTINDB_API_KEY;
  if (!apiKey) return null;

  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 5000);

    let res: Response;
    try {
      res = await fetch(
        `https://opengtindb.org/api/v1/product?ean=${barcode}&apikey=${apiKey}`,
        { signal: ctrl.signal }
      );
    } finally {
      clearTimeout(timer);
    }

    if (!res.ok) return null;

    const data = (await res.json()) as {
      name?: string;
      vendor?: string;
      detailname?: string;
      maincat?: string;
    };

    if (!data.name) return null;

    return {
      barcode,
      name: data.name || null,
      manufacturer: data.vendor || null,
      description: data.detailname || null,
      imageUrl: null,
      category: data.maincat || null,
      source: "opengtindb",
    };
  } catch {
    return null;
  }
}
