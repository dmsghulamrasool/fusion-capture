'use client';

import { useAuth } from '@/contexts/AuthContext';
import { ReactNode } from 'react';

interface RequireRoleProps {
  children: ReactNode;
  role: string;
  fallback?: ReactNode;
  showFallback?: boolean;
}

export function RequireRole({
  children,
  role,
  fallback,
  showFallback = true,
}: RequireRoleProps) {
  const { user, hasRole } = useAuth();

  // If no user is logged in, deny access
  if (!user) {
    return showFallback ? (fallback || null) : null;
  }

  if (!hasRole(role)) {
    return showFallback ? (fallback || null) : null;
  }

  return <>{children}</>;
}

