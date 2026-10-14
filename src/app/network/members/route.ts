import { NextResponse, type NextRequest } from "next/server";

/**
 * The member directory now lives at /people. A route handler (not a page) so the
 * redirect is a real 307 that isn't held back by the /network role guard.
 */
export function GET(req: NextRequest) {
  const url = req.nextUrl.clone();
  url.pathname = "/people";
  return NextResponse.redirect(url, 307);
}
