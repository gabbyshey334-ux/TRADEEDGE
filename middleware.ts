import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseEnv } from "@/lib/supabase/env";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // API routes and webhooks must not run auth middleware (Stripe, etc.)
  if (pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  const env = getSupabaseEnv();
  if (!env) {
    if (pathname.startsWith("/dashboard")) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.next();
  }

  let supabaseResponse = NextResponse.next({ request });

  try {
    const supabase = createServerClient(env.url, env.anonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(
          cookiesToSet: Array<{
            name: string;
            value: string;
            options?: CookieOptions;
          }>
        ) {
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    });

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (
      authError &&
      (authError.code === "refresh_token_not_found" ||
        authError.code === "session_not_found")
    ) {
      await supabase.auth.signOut();
    }

    if (pathname.startsWith("/dashboard") && !user) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    if ((pathname === "/login" || pathname === "/signup") && user) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  } catch {
    if (pathname.startsWith("/dashboard")) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
