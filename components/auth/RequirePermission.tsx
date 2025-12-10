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
  const { hasPermission, hasAnyPermission, hasAllPermissions } = useAuth();

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

