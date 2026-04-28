import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { writeFile } from "fs/promises";
import { join } from "path";
import type { ApiResponse } from "@/types/api";

const MAX_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json<ApiResponse<null>>(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json<ApiResponse<null>>(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json<ApiResponse<null>>(
        { error: "File must be JPEG, PNG, WebP, or GIF" },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json<ApiResponse<null>>(
        { error: "File must be under 2MB" },
        { status: 400 }
      );
    }

    const ext = file.type.split("/")[1].replace("jpeg", "jpg");
    const filename = `${session.user.id}-${Date.now()}.${ext}`;

    const bytes = new Uint8Array(await file.arrayBuffer());
    const path = join(process.cwd(), "public", "avatars", filename);
    await writeFile(path, bytes);

    const url = `/avatars/${filename}`;

    return NextResponse.json({ data: { url } });
  } catch {
    return NextResponse.json<ApiResponse<null>>(
      { error: "Failed to upload avatar" },
      { status: 500 }
    );
  }
}
