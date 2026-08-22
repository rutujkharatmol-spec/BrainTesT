import { NextResponse } from "next/server";
import { ADMIN_PASSWORD, ADMIN_COOKIE_NAME, generateAdminSessionToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { password } = body;

    if (!password || typeof password !== "string") {
      return NextResponse.json(
        { success: false, error: "Please enter the admin password." },
        { status: 400 }
      );
    }

    if (password.trim() !== ADMIN_PASSWORD) {
      return NextResponse.json(
        { success: false, error: "Invalid admin password. Please try again." },
        { status: 401 }
      );
    }

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
