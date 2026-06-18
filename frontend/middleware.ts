import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  return NextResponse.redirect(new URL("/", request.url));
}

export const config = {
  matcher: ["/demo/:path*", "/projects/:path*", "/keywords/:path*", "/posts/:path*", "/creators/:path*", "/analytics/:path*", "/jobs/:path*"]
};
