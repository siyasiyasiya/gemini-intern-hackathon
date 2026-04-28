import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { constellations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { checkConstellationAccess } from "@/lib/db/check-membership";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const session = await auth();
    const { constellation: access, forbidden } = await checkConstellationAccess(slug, session?.user?.id);

    if (!access) {
      return NextResponse.json({ error: "Constellation not found" }, { status: 404 });
    }

    if (forbidden) {
      return NextResponse.json({ error: "This constellation is private" }, { status: 403 });
    }

    // Fetch full constellation data
    const [constellation] = await db
      .select()
      .from(constellations)
      .where(eq(constellations.slug, slug))
      .limit(1);

    return NextResponse.json({ data: constellation });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch constellation" }, { status: 500 });
  }
}
