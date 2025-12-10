"use client";

import { createContext, useContext, ReactNode } from "react";
import { useSession } from "next-auth/react";

interface AuthContextType {
  user: {
    id: string;
    email?: string | null;
    name?: string | null;
    image?: string | null;
    roles: string[];
    permissions: string[];
  } | null;
  loading: boolean;
  hasRole: (role: string) => boolean;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  hasRole: () => false,
  hasPermission: () => false,
  hasAnyPermission: () => false,
  hasAllPermissions: () => false,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();

  const hasRole = (role: string): boolean => {
    if (!session?.user?.roles) return false;
    return session.user.roles.includes(role);
  };

  const hasPermission = (permission: string): boolean => {
    // Admin has all permissions
    if (session?.user?.roles?.includes('admin')) {
      return true;
    }
    if (!session?.user?.permissions) return false;
    return session.user.permissions.includes(permission);
  };

  const hasAnyPermission = (permissions: string[]): boolean => {
    // Admin has all permissions
    if (session?.user?.roles?.includes('admin')) {
      return true;
    }
    if (!session?.user?.permissions) return false;
    return permissions.some((perm) =>
      session.user?.permissions?.includes(perm)
    );
  };

  const hasAllPermissions = (permissions: string[]): boolean => {
    // Admin has all permissions
    if (session?.user?.roles?.includes('admin')) {
      return true;
    }
    if (!session?.user?.permissions) return false;
    return permissions.every((perm) =>
      session.user?.permissions?.includes(perm)
    );
  };

  return (
    <AuthContext.Provider
      value={{
        user: session?.user || null,
        loading: status === "loading",
        hasRole,
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
