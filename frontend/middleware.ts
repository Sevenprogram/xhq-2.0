import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  return NextResponse.redirect(new URL("/demo", request.url));
}

export const config = {
  matcher: ["/", "/projects/:path*", "/keywords/:path*", "/posts/:path*", "/creators/:path*", "/analytics/:path*", "/jobs/:path*"]
};
