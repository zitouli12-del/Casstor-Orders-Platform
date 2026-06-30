import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  console.log("🔥 MIDDLEWARE:", request.nextUrl.pathname);
  let response = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },

        set(name: string, value: string, options) {
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },

        remove(name: string, options) {
          response.cookies.set({
            name,
            value: "",
            ...options,
          });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  const publicRoutes = [
    "/",
    "/login",
    "/signup",
  ];

  const isPublicRoute =
    publicRoutes.includes(pathname);

  // إذا ماكانش Login
  if (!user && !isPublicRoute) {
    return NextResponse.redirect(
      new URL("/login", request.url)
    );
  }

  // إذا راه Login وحاول يدخل Login أو Signup
  if (
    user &&
    (pathname === "/login" ||
      pathname === "/signup")
  ) {
    return NextResponse.redirect(
      new URL("/confirmation", request.url)
    );
  }

  return response;
}

export const config = {
  matcher: [
    "/",
    "/login",
    "/signup",

    "/confirmation/:path*",
    "/historique/:path*",
    "/transporteurs/:path*",
    "/bon-livraisons/:path*",
    "/parametres/:path*",

    "/api/shipping/:path*",
    "/api/bon-livraisons/:path*",
  ],
};