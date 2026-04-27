import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { constellations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const [constellation] = await db
      .select()
      .from(constellations)
      .where(eq(constellations.slug, slug))
      .limit(1);

    if (!constellation) {
      return NextResponse.json({ error: "Constellation not found" }, { status: 404 });
    }

    return NextResponse.json({ data: constellation });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch constellation" }, { status: 500 });
  }
}
