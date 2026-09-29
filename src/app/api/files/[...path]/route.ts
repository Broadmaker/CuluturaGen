import { NextResponse } from "next/server";
import { mimeForExt, readStorageFile } from "@/lib/storage";
import { getSessionUser } from "@/lib/auth/session";

// Read-only local file serving (generated images, uploads, reports).
// Path traversal is rejected in storage.ts; auth required for all reads.
export async function GET(
  _req: Request,
  { params }: { params: { path: string[] } },
) {
  const user = await getSessionUser().catch(() => null);
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const relative = (params.path ?? []).join("/");
  if (!relative || relative.includes("..")) {
    return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });
  }
  const file = await readStorageFile(relative);
  if (!file) return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });

  return new NextResponse(new Uint8Array(file.bytes), {
    headers: {
      "Content-Type": mimeForExt(file.ext),
      "Cache-Control": "private, max-age=3600",
    },
  });
}
