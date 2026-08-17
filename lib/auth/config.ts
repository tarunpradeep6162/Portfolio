// NextAuth configuration

import type { NextAuthConfig } from "next-auth";
import GitHub from "next-auth/providers/github";
import Credentials from "next-auth/providers/credentials";

export const authConfig: NextAuthConfig = {
  providers: [
    GitHub({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // TODO: Implement actual password verification with database
        if (
          credentials?.email === "admin@tarunpradeep.dev" &&
          credentials?.password === "demo-password"
        ) {
          return {
            id: "1",
            email: credentials.email,
            name: "Admin",
            role: "admin",
          };
        }
        return null;
      },
    }),
  ],

  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role || "user";
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },

    async redirect({ url, baseUrl }) {
      return url.startsWith(baseUrl) ? url : baseUrl;
    },

    async signIn({ user, account }) {
      // Whitelist specific OAuth providers
      if (account?.provider === "github") {
        return true;
      }
      // Allow credentials login
      if (!account) {
        return true;
      }
      return false;
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
  trustHost: true,
};
