import { NextResponse } from "next/server";
import { ADMIN_PASSWORD, ADMIN_COOKIE_NAME, generateAdminSessionToken, isAdminAuthConfigured, safeEquals } from "@/lib/auth";
import { checkRateLimit, resetRateLimit, clientIp } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    // Refuse rather than fall back to a default credential when the
    // deployment has not been configured.
    if (!isAdminAuthConfigured()) {
      console.error("Admin login attempted but ADMIN_PASSWORD / NEXTAUTH_SECRET are not set.");
      return NextResponse.json(
        { success: false, error: "Admin access is not configured on this server." },
        { status: 503 }
      );
    }

    // Rate limiting remains a useful second line of defence against guessing,
    // though it is per-process and therefore per-instance on serverless: the
    // strength of ADMIN_PASSWORD is the control that actually matters.
    const key = `admin-login:${clientIp(req)}`;
    const limit = checkRateLimit(key, { limit: 5, windowMs: 15 * 60_000, blockMs: 15 * 60_000 });
    if (!limit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `Too many failed attempts. Please try again in ${Math.ceil(limit.retryAfter / 60)} minute(s).`,
        },
        { status: 429, headers: { "Retry-After": String(limit.retryAfter) } }
      );
    }

    const body = await req.json();
    const { password } = body;

    if (!password || typeof password !== "string") {
      return NextResponse.json(
        { success: false, error: "Please enter the admin password." },
        { status: 400 }
      );
    }

    if (!safeEquals(password.trim(), ADMIN_PASSWORD)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid admin password. ${limit.remaining} attempt(s) remaining before a temporary lockout.`,
        },
        { status: 401 }
      );
    }

    resetRateLimit(key);
    const token = generateAdminSessionToken();
    const response = NextResponse.json(
      {
        success: true,
        message: "Admin authenticated successfully.",
      },
      { status: 200 }
    );

    // Set HTTP-only admin session cookie for 30 days
    response.cookies.set(ADMIN_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return response;
  } catch (error: any) {
    console.error("Admin login API error:", error);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred during authentication. Please try again." },
      { status: 500 }
    );
  }
}
