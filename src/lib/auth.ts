import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { getServerSession } from "next-auth/next";
import { cookies } from "next/headers";
import crypto from "crypto";

/**
 * Admin credentials come from the environment only.
 *
 * These used to fall back to literals committed in this file. That made the
 * password readable by anyone with repo access, and made the session-token
 * HMAC key guessable, so a token could be forged without knowing the password
 * at all. Both now fail closed: if the environment is not configured, admin
 * authentication is disabled rather than silently accepting a weak default.
 */
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "";
export const ADMIN_COOKIE_NAME = "admin_session_token";
const AUTH_SECRET = process.env.NEXTAUTH_SECRET ?? "";

/** True when the deployment has the secrets needed to authenticate an admin. */
export function isAdminAuthConfigured(): boolean {
  return ADMIN_PASSWORD.length > 0 && AUTH_SECRET.length > 0;
}

/**
 * Constant-time string comparison, so a wrong password cannot be discovered
 * one character at a time by measuring how long the comparison takes.
 */
export function safeEquals(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Creates a signed admin session token.
 */
export function generateAdminSessionToken(): string {
  if (!isAdminAuthConfigured()) {
    throw new Error("ADMIN_PASSWORD and NEXTAUTH_SECRET must be set to issue an admin session.");
  }
  const timestamp = Date.now().toString();
  const signature = crypto
    .createHmac("sha256", AUTH_SECRET)
    .update(`admin:${timestamp}`)
    .digest("hex");
  return `${timestamp}.${signature}`;
}

/**
 * Validates an admin session token.
 */
export function isValidAdminSessionToken(token: string | undefined | null): boolean {
  // No secret configured means no token can be trusted -- an empty HMAC key
  // would make every forged token verify.
  if (!isAdminAuthConfigured()) {
    return false;
  }
  if (!token || typeof token !== "string" || !token.includes(".")) {
    return false;
  }
  const [timestamp, signature] = token.split(".");
  if (!timestamp || !signature) {
    return false;
  }

  // Token valid for 30 days
  const tokenTime = parseInt(timestamp, 10);
  if (isNaN(tokenTime) || Date.now() - tokenTime > 1000 * 60 * 60 * 24 * 30) {
    return false;
  }

  try {
    const expectedSignature = crypto
      .createHmac("sha256", AUTH_SECRET)
      .update(`admin:${timestamp}`)
      .digest("hex");

    const sigBuf = Buffer.from(signature, "hex");
    const expBuf = Buffer.from(expectedSignature, "hex");

    if (sigBuf.length !== expBuf.length) {
      return false;
    }

    return crypto.timingSafeEqual(sigBuf, expBuf);
  } catch {
    return false;
  }
}

/**
 * Unified server-side admin authentication check.
 * Checks the secure admin cookie first, then falls back to NextAuth session.
 */
export async function verifyAdminSession(): Promise<{ user: { id: string; name: string; email: string } } | null> {
  try {
    // 1. Check HTTP-only admin cookie
    const cookieStore = cookies();
    const adminToken = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
    if (adminToken && isValidAdminSessionToken(adminToken)) {
      return {
        user: {
          id: "admin",
          name: "Administrator",
          email: "admin@aiims-kalyani.local",
        },
      };
    }

    // 2. Fallback to NextAuth getServerSession
    const session = await getServerSession(authOptions);
    if (session?.user) {
      return {
        user: {
          id: "admin",
          name: session.user.name || "Administrator",
          email: session.user.email || "admin@aiims-kalyani.local",
        },
      };
    }
  } catch (err: any) {
    if (err?.digest === "DYNAMIC_SERVER_USAGE" || err?.message?.includes("DYNAMIC_SERVER_USAGE")) {
      throw err;
    }
    console.error("verifyAdminSession error:", err);
  }

  return null;
}

export const authOptions: NextAuthOptions = {
  pages: {
    signIn: "/admin/login",
  },
  providers: [
    CredentialsProvider({
      name: "Admin Password",
      credentials: {
        password: { label: "Admin Password", type: "password", placeholder: "Enter password" }
      },
      async authorize(credentials) {
        if (!isAdminAuthConfigured()) return null;
        if (typeof credentials?.password === "string" && safeEquals(credentials.password, ADMIN_PASSWORD)) {
          return { id: "admin", name: "Administrator", email: "admin@aiims-kalyani.local" };
        }
        return null;
      }
    })
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async redirect({ url, baseUrl }) {
      // If it's a relative URL, return it as is or prepend baseUrl
      if (url.startsWith("/")) {
        return url;
      }
      // If it's on the same origin (such as your Vercel deployment), allow it
      try {
        if (new URL(url).origin === baseUrl) {
          return url;
        }
      } catch {
        // Fallback for invalid URLs
      }
      return "/admin/export";
    }
  },
  secret: AUTH_SECRET
};
