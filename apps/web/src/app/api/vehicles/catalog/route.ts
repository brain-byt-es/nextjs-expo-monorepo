import { NextResponse } from "next/server";

// ---------------------------------------------------------------------------
// In-memory cache (24h TTL)
// ---------------------------------------------------------------------------
const cache = new Map<string, { data: unknown; expiresAt: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.data as T;
}

function setCache(key: string, data: unknown): void {
  cache.set(key, { data, expiresAt: Date.now() + CACHE_TTL });
}

// ---------------------------------------------------------------------------
// Swiss-market fallback catalog
// ---------------------------------------------------------------------------
const FALLBACK_CATALOG: Record<string, string[]> = {
  Volkswagen: [
    "Golf",
    "Passat",
    "Tiguan",
    "Transporter T6",
    "Crafter",
    "Caddy",
    "ID.4",
  ],
  "Mercedes-Benz": [
    "Sprinter",
    "Vito",
    "C-Klasse",
    "E-Klasse",
    "GLC",
    "Citan",
    "eVito",
  ],
  BMW: ["3er", "5er", "X3", "X5", "i4", "iX"],
  Audi: ["A3", "A4", "A6", "Q3", "Q5", "e-tron"],
  Toyota: ["Yaris", "Corolla", "RAV4", "Hilux", "Proace", "Land Cruiser"],
  Ford: ["Transit", "Transit Custom", "Ranger", "Focus", "Kuga"],
  Renault: ["Kangoo", "Master", "Trafic", "Clio", "Megane", "Zoe"],
  Peugeot: ["Partner", "Expert", "Boxer", "208", "308", "3008"],
  "Citro\u00ebn": ["Berlingo", "Jumpy", "Jumper", "C3", "C4", "C5 X"],
  Fiat: ["Ducato", "Dobl\u00f2", "Scudo", "500", "Panda", "Tipo"],
  Opel: ["Vivaro", "Movano", "Combo", "Corsa", "Astra", "Mokka"],
  "\u0160koda": ["Octavia", "Superb", "Kodiaq", "Karoq", "Fabia", "Enyaq"],
  Iveco: ["Daily", "Eurocargo", "S-Way"],
  MAN: ["TGE", "TGL", "TGM", "TGS"],
  Volvo: ["FH", "FL", "XC40", "XC60", "XC90"],
  Nissan: ["NV200", "NV300", "NV400", "Qashqai", "Leaf"],
  Hyundai: ["Tucson", "Kona", "i30", "IONIQ 5", "Staria"],
  Mitsubishi: ["L200", "Outlander", "Eclipse Cross"],
  Suzuki: ["Jimny", "Vitara", "Swift", "S-Cross"],
  Subaru: ["Outback", "Forester", "XV", "Impreza"],
  Dacia: ["Duster", "Jogger", "Sandero", "Spring"],
  Tesla: ["Model 3", "Model Y", "Model S", "Model X", "Cybertruck"],
  Piaggio: ["Porter", "Ape"],
  Multicar: ["M31", "Tremo"],
};

// ---------------------------------------------------------------------------
// NHTSA vPIC API helpers
// ---------------------------------------------------------------------------
async function fetchNhtsaMakes(): Promise<string[]> {
  const cacheKey = "nhtsa_makes";
  const cached = getCached<string[]>(cacheKey);
  if (cached) return cached;

  try {
    const res = await fetch(
      "https://vpic.nhtsa.dot.gov/api/vehicles/GetMakesForVehicleType/car?format=json",
      { signal: AbortSignal.timeout(5000) }
    );
    if (!res.ok) throw new Error(`NHTSA ${res.status}`);
    const json = await res.json();
    const makes: string[] = (json.Results ?? [])
      .map((r: { MakeName?: string }) => r.MakeName ?? "")
      .filter(Boolean)
      .sort((a: string, b: string) => a.localeCompare(b, "de"));
    setCache(cacheKey, makes);
    return makes;
  } catch {
    // Fall back to local catalog
    return Object.keys(FALLBACK_CATALOG).sort((a, b) =>
      a.localeCompare(b, "de")
    );
  }
}

async function fetchNhtsaModels(make: string): Promise<string[]> {
  const cacheKey = `nhtsa_models_${make.toLowerCase()}`;
  const cached = getCached<string[]>(cacheKey);
  if (cached) return cached;

  // Check local fallback first (faster, Swiss-relevant)
  const localModels = FALLBACK_CATALOG[make];
  if (localModels) {
    setCache(cacheKey, localModels);
    return localModels;
  }

  try {
    const res = await fetch(
      `https://vpic.nhtsa.dot.gov/api/vehicles/GetModelsForMake/${encodeURIComponent(make)}?format=json`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (!res.ok) throw new Error(`NHTSA ${res.status}`);
    const json = await res.json();
    const models: string[] = (json.Results ?? [])
      .map((r: { Model_Name?: string }) => r.Model_Name ?? "")
      .filter(Boolean)
      .sort((a: string, b: string) => a.localeCompare(b, "de"));
    if (models.length > 0) {
      setCache(cacheKey, models);
      return models;
    }
    return [];
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------
export async function GET(request: Request) {
  const url = new URL(request.url);
  const type = url.searchParams.get("type");
  const make = url.searchParams.get("make");

  if (type === "makes") {
    const makes = await fetchNhtsaMakes();
    return NextResponse.json({ makes });
  }

  if (type === "models" && make) {
    const models = await fetchNhtsaModels(make);
    return NextResponse.json({ models });
  }

  return NextResponse.json(
    { error: "Invalid params. Use ?type=makes or ?type=models&make=Toyota" },
    { status: 400 }
  );
}
