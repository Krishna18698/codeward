import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

/** The values each page accepts in ?view=, by path.
 *
 *  A ?view= that isn't listed is a typo or a bookmark of a view that has since
 *  been removed. Rendering the default view under a URL that claims otherwise
 *  left the address bar lying, so the parameter is dropped and the request
 *  redirected to the canonical URL.
 *
 *  It lives here rather than in the page because a redirect thrown during
 *  render arrives after the layout shell has streamed — the browser still
 *  follows it, but as a soft navigation with a 200 on the wire. Here it is a
 *  real 307, and the page is never rendered twice.
 *
 *  Only parameters we own are judged: a ?view= with a bad value is dropped,
 *  while utm_source, fbclid and anything else on the query string are carried
 *  through untouched. */
const VIEWS: Record<string, string[]> = {
  "/dashboard/dsa": ["bank"],
};

export default async function proxy(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  const views = VIEWS[request.nextUrl.pathname];
  const view = request.nextUrl.searchParams.get("view");
  // 307, not 308: a mistyped URL shouldn't be cached as a permanent move.
  if (views && view !== null && !views.includes(view)) {
    const canonical = request.nextUrl.clone();
    canonical.searchParams.delete("view");
    return NextResponse.redirect(canonical);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
