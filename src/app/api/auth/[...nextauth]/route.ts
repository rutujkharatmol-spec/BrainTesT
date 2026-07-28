import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Admin Login",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "admin@example.com" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const adminUser = await prisma.adminUser.findUnique({
          where: { email: credentials.email }
        });

        if (!adminUser) return null;

        const isMatch = await bcrypt.compare(credentials.password, adminUser.password);
        if (!isMatch) return null;

        return { id: adminUser.id, email: adminUser.email };
      }
    })
  ],
  session: {
    strategy: "jwt",
  }
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
