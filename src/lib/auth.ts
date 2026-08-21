import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

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
        if (credentials?.password === "0907") {
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
  secret: process.env.NEXTAUTH_SECRET || "your-super-secret-string-here"
};
