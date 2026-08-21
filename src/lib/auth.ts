import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Admin Password",
      credentials: {
        password: { label: "Admin Password", type: "password", placeholder: "Enter password" }
      },
      async authorize(credentials) {
        if (credentials?.password === "0907") {
          return { id: "admin", name: "Administrator", email: "admin@local" };
        }
        return null;
      }
    })
  ],
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET || "your-super-secret-string-here"
};
