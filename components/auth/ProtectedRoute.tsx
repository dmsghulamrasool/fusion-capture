"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, ReactNode } from "react";
import { Loading } from "@/components/ui/Loading";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: string;
  requiredPermission?: string;
  requiredPermissions?: string[];
  requireAll?: boolean;
  fallback?: ReactNode;
}

export function ProtectedRoute({
  children,
  requiredRole,
  requiredPermission,
  requiredPermissions,
  requireAll = false,
  fallback,
}: ProtectedRouteProps) {
  const {
    user,
    loading,
    hasRole,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
  } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Only redirect if we're sure there's no user (not loading)
    if (!loading && !user) {
      const currentPath = window.location.pathname;
      if (currentPath !== "/login") {
        router.push("/login");
      }
    }
  }, [loading, user, router]);

  // Show loading state
  if (loading) {
    return <Loading />;
  }

  // If no user after loading, show fallback or nothing (redirect will happen)
  if (!user) {
    return fallback || <Loading />;
  }

  // Check role requirement
  if (requiredRole && !hasRole(requiredRole)) {
    router.push("/unauthorized");
    return null;
  }

  // Check single permission
  if (requiredPermission && !hasPermission(requiredPermission)) {
    router.push("/unauthorized");
    return null;
  }

  // Check multiple permissions
  if (requiredPermissions && requiredPermissions.length > 0) {
    const hasAccess = requireAll
      ? hasAllPermissions(requiredPermissions)
      : hasAnyPermission(requiredPermissions);

    if (!hasAccess) {
      router.push("/unauthorized");
      return null;
    }
  }

  return <>{children}</>;
}
