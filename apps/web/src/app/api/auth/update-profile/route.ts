import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { auth } from "@/lib/auth";

const MAX_IMAGE_BYTES = 2 * 1024 * 1024; // 2 MB expressed as base64 (~2.7 MB raw string)

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, image } = body as { name?: unknown; image?: unknown };

    // At least one field must be present
    if (name === undefined && image === undefined) {
      return NextResponse.json(
        { error: "Keine Felder zum Aktualisieren angegeben." },
        { status: 400 }
      );
    }

    const updatePayload: Record<string, string | null> = {};

    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        return NextResponse.json(
          { error: "Ungültiger Name." },
          { status: 400 }
        );
      }
      updatePayload.name = name.trim();
    }

    if (image !== undefined) {
      // null means "remove the avatar"
      if (image === null) {
        updatePayload.image = null;
      } else {
        if (typeof image !== "string") {
          return NextResponse.json(
            { error: "Ungültiges Bildformat." },
            { status: 400 }
          );
        }
        // Validate it is a data URL with an allowed MIME type
        if (!image.startsWith("data:image/jpeg;base64,") &&
            !image.startsWith("data:image/png;base64,") &&
            !image.startsWith("data:image/webp;base64,")) {
          return NextResponse.json(
            { error: "Nur JPEG, PNG und WebP sind erlaubt." },
            { status: 400 }
          );
        }
        // Enforce max size (base64 string length ≈ 4/3 of raw bytes)
        if (image.length > MAX_IMAGE_BYTES * (4 / 3) + 100) {
          return NextResponse.json(
            { error: "Bild darf maximal 2 MB gross sein." },
            { status: 400 }
          );
        }
        updatePayload.image = image;
      }
    }

    await auth.api.updateUser({
      body: updatePayload,
      headers: request.headers,
    });

    return NextResponse.json({
      success: true,
      user: { ...session.user, ...updatePayload },
    });
  } catch (error) {
    Sentry.captureException(error, { tags: { endpoint: "update-profile" } });
    console.error("Profile update error:", error);
    return NextResponse.json(
      { error: "Profil konnte nicht aktualisiert werden." },
      { status: 500 }
    );
  }
}
