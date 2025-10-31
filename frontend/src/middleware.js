import { NextResponse } from "next/server";

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  const authToken = request.cookies.get("auth_token")?.value;

  const protectedRoutes = [
    "/dashboard",
    "/profile",
    "/interview/setup",
    "/interview/live",
    "/interview/summary",
    "/interview/history-reports",
    "/interview/report",
  ];
  const authRoutes = ["/auth"];

  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  if (isProtectedRoute) {
    if (!authToken || authToken.length < 10) {
      const url = request.nextUrl.clone();
      url.pathname = "/auth";
      return NextResponse.redirect(url);
    }

    const response = NextResponse.next();
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
    return response;
  }

  if (isAuthRoute) {
    if (authToken && authToken.length >= 10) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }

    const response = NextResponse.next();
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard",
    "/profile",
    "/interview/setup",
    "/interview/live",
    "/interview/summary",
    "/interview/history-reports",
    "/interview/report/:path*",
    "/auth",
    "/",
  ],
};
