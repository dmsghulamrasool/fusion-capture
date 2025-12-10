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
  const { hasRole } = useAuth();

  if (!hasRole(role)) {
    return showFallback ? (fallback || null) : null;
  }

  return <>{children}</>;
}

