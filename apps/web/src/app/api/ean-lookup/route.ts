import { NextResponse } from "next/server";
import { getSession } from "@/app/api/_helpers/auth";
import { lookupEan } from "@/lib/ean-lookup";

// EAN barcodes are 8–14 digits (EAN-8, EAN-13, GTIN-14, UPC-A/E, etc.)
const BARCODE_RE = /^\d{8,14}$/;

export async function GET(request: Request) {
  try {
    const result = await getSession();
    if (result.error) return result.error;

    const code = new URL(request.url).searchParams.get("code");

    if (!code) {
      return NextResponse.json(
        { error: "Query parameter 'code' is required" },
        { status: 400 }
      );
    }

    if (!BARCODE_RE.test(code)) {
      return NextResponse.json(
        { error: "Invalid barcode — must be 8–14 digits" },
        { status: 400 }
      );
    }

    const product = await lookupEan(code);

    if (!product) {
      return NextResponse.json({ found: false });
    }

    return NextResponse.json({ found: true, product });
  } catch (error) {
    console.error("GET /api/ean-lookup error:", error);
    return NextResponse.json(
      { error: "EAN lookup failed" },
      { status: 500 }
    );
  }
}
