import type { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import type { Adapter, AdapterAccount } from "next-auth/adapters";
import { prisma } from "@/lib/prisma";
import { LOGIN_THROTTLED, loginAllowed, recordLoginFailure } from "@/lib/ratelimit";
import bcrypt from "bcryptjs";

/**
 * Google is used purely to authenticate — we never call Google APIs on a
 * user's behalf. Persisting OAuth credentials would store secrets we can
 * never use, so strip them before the adapter writes the Account row.
 * The adapter is still needed: it creates the User row for Google sign-ups.
 */
function adapterWithoutOAuthTokens(): Adapter {
  const base = PrismaAdapter(prisma);
  return {
    ...base,
    linkAccount: async (account: AdapterAccount) => {
      const safe = { ...account };
      delete safe.access_token;
      delete safe.refresh_token;
      delete safe.id_token;
      await base.linkAccount!(safe);
    },
  };
}

export const authOptions: NextAuthOptions = {
  adapter: adapterWithoutOAuthTokens(),
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) return null;

        // Throttle before the lookup and bcrypt: every attempt used to reach
        // the database and the hash compare, with nothing stopping a password
        // spray. Keyed on the account and on the caller's IP; only failures
        // spend the allowance.
        const email = credentials.email.toLowerCase().trim();
        const forwarded = req?.headers?.["x-forwarded-for"];
        const ip = (Array.isArray(forwarded) ? forwarded[0] : forwarded)?.split(",")[0].trim() || "anonymous";
        if (!(await loginAllowed(email, ip))) throw new Error(LOGIN_THROTTLED);

        // Case-INSENSITIVE lookup. Postgres's unique index on email is
        // case-sensitive, so an exact match means someone who registered as
        // foo@x.com but types Foo@x.com is told their credentials are invalid.
        // Where rows differ only by case, prefer the one that has a password —
        // that's the only one this provider can authenticate.
        const matches = await prisma.user.findMany({
          where: { email: { equals: email, mode: "insensitive" } },
        });
        const user = matches.find((u) => u.password) ?? null;

        if (!user?.password) {
          await recordLoginFailure(email, ip);
          return null;
        }

        const passwordMatch = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!passwordMatch) {
          await recordLoginFailure(email, ip);
          return null;
        }

        return { id: user.id, email: user.email, name: user.name, image: user.image };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        // token.sub is the user id NextAuth sets by default — covers legacy JWTs
        session.user.id = (token.id as string | undefined) ?? token.sub ?? "";
      }
      return session;
    },
  },
};

/**
 * Returns the authenticated user's id, or null.
 * Replaces the getServerSession() + prisma.user.findUnique({ email })
 * pair — the JWT already carries the id, so no DB round trip is needed.
 */
export async function getSessionUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  return session?.user?.id || null;
}
