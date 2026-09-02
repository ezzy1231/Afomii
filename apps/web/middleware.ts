import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { readEnv } from "@/lib/env";

const protectedRoutes = ["/dashboard", "/settings"];

// Origins pointing at localhost/loopback are dev leftovers (the repo's
// .env.local ships NEXT_PUBLIC_ADMIN_ORIGIN=http://localhost:3001). On a
// hosted instance they must be treated as unset, otherwise the middleware
// would redirect admin logins to "localhost" on the visitor's machine.
function realOrigin(value: string | undefined): string | undefined {
  if (!value) return undefined;
  try {
    const { hostname } = new URL(value);
    if (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1") {
      return undefined;
    }
    return value.replace(/\/+$/, "");
  } catch {
    return undefined;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Two-instance split ──────────────────────────────────────────────────
  // main  (:3000) -> consumer + partner surfaces
  // admin (:3001, ADMIN_PORTAL=1) -> /dashboard/admin surfaces only.
  // Sessions are cookie-based and cookies ignore ports, so one sign-in works
  // across both instances.
  //
  // On a single hosted deployment (no second instance) leave
  // NEXT_PUBLIC_ADMIN_ORIGIN / NEXT_PUBLIC_MAIN_ORIGIN unset: admin routes
  // are then served by the same app, and the admin layout still enforces the
  // system_admin role.
  const adminPortal = readEnv("ADMIN_PORTAL") === "1";
  const adminOrigin = realOrigin(readEnv("NEXT_PUBLIC_ADMIN_ORIGIN"));
  const mainOrigin = realOrigin(readEnv("NEXT_PUBLIC_MAIN_ORIGIN"));

  if (!adminPortal && adminOrigin && pathname.startsWith("/dashboard/admin")) {
    // Main instance never serves admin routes — send visitors to the portal.
    const url = new URL(`${adminOrigin}${pathname}${request.nextUrl.search}`);
    // Never redirect to the origin we're already serving on — that's a loop
    // (e.g. dev where NEXT_PUBLIC_ADMIN_ORIGIN points at the same instance).
    if (url.origin !== request.nextUrl.origin) {
      return NextResponse.redirect(url);
    }
  }

  if (adminPortal && !pathname.startsWith("/dashboard/admin") && !pathname.startsWith("/auth/")) {
    // Inside the portal, funnels strays into the panel itself (e.g. the '/'
    // that sign-in lands on), so admins never get dumped onto the main site.
    if (!mainOrigin || pathname === "/") {
      return NextResponse.redirect(new URL("/dashboard/admin", request.url));
    }
    const url = new URL(`${mainOrigin}${pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(url);
  }
  // ────────────────────────────────────────────────────────────────────────

  const isProtected = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  if (!isProtected) {
    return NextResponse.next();
  }

  const response = NextResponse.next();
  const supabaseUrl = readEnv("NEXT_PUBLIC_SUPABASE_URL");
  const supabaseAnonKey = readEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");

  if (!supabaseUrl || !supabaseAnonKey) {
    return response;
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const signInUrl = new URL("/auth/signin", request.url);
    signInUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(signInUrl);
  }

  if (pathname.startsWith("/dashboard")) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, is_suspended")
      .eq("id", user.id)
      .maybeSingle();

    if ((profile?.is_suspended as boolean | undefined) === true) {
      const suspendedUrl = new URL("/auth/suspended", request.url);
      return NextResponse.redirect(suspendedUrl);
    }

    const role = profile?.role as string | undefined;

    if (pathname.startsWith("/dashboard/restaurant") && role !== "food_business") {
      return NextResponse.redirect(new URL("/", request.url));
    }

    if (pathname.startsWith("/dashboard/organizer") && role !== "event_organizer") {
      return NextResponse.redirect(new URL("/", request.url));
    }

    if (pathname.startsWith("/dashboard/admin") && role !== "system_admin") {
      // On the admin portal, a plain "/" redirect loops (the portal funnels
      // "/" back into the panel) — always show the explicit no-access page so
      // people can SEE which account lacks rights and switch.
      return NextResponse.redirect(new URL("/auth/no-access", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
