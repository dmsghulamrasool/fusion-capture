import type { NextAuthConfig } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import clientPromise from "./mongodb";
import { assignRolesAndPermissions } from "./rbac";

export const authOptions: NextAuthConfig = {
  secret: process.env.NEXTAUTH_SECRET,
  adapter: MongoDBAdapter(clientPromise),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true, // Allow linking multiple providers
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true, // Allow linking multiple providers
    }),
  ],
  callbacks: {
    async session({ session, user }: any) {
      // Assign roles and permissions to user
      if (user?.id) {
        const userWithPermissions = await assignRolesAndPermissions(
          user.id.toString()
        );

        return {
          ...session,
          user: {
            ...session.user,
            id: user.id.toString(),
            roles: userWithPermissions.roles,
            permissions: userWithPermissions.permissions,
          },
        };
      }
      return session;
    },
    async signIn({ user, account, profile }: any) {
      // After sign in, assign default role if user is new
      if (user?.email && user?.id) {
        await assignRolesAndPermissions(user.id.toString());
      }
      return true;
    },
  },
  pages: {
    signIn: "/login",
    error: "/unauthorized",
  },
  session: {
    strategy: "database",
  },
};
