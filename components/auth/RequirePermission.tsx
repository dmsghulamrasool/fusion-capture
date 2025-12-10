'use client';

import { useAuth } from '@/contexts/AuthContext';
import { ReactNode } from 'react';

interface RequirePermissionProps {
  children: ReactNode;
  permission?: string;
  permissions?: string[];
  requireAll?: boolean;
  fallback?: ReactNode;
  showFallback?: boolean;
}

export function RequirePermission({
  children,
  permission,
  permissions,
  requireAll = false,
  fallback,
  showFallback = true,
}: RequirePermissionProps) {
  const { user, hasPermission, hasAnyPermission, hasAllPermissions } = useAuth();

  // If no user is logged in and permission is required, deny access
  if (!user && (permission || (permissions && permissions.length > 0))) {
    return showFallback ? (fallback || null) : null;
  }

  let hasAccess = true;

  if (permission) {
    hasAccess = hasPermission(permission);
  } else if (permissions && permissions.length > 0) {
    hasAccess = requireAll
      ? hasAllPermissions(permissions)
      : hasAnyPermission(permissions);
  }

  if (!hasAccess) {
    return showFallback ? (fallback || null) : null;
  }

  return <>{children}</>;
}

