import { NextResponse, type NextRequest } from "next/server";

/** Member profiles now live at /people/[id]. Old links (notifications, admin tools) keep working. */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const url = req.nextUrl.clone();
  url.pathname = `/people/${encodeURIComponent(decodeURIComponent(id))}`;
  return NextResponse.redirect(url, 307);
}
