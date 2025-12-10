'use client';

import { useAuth } from '@/contexts/AuthContext';
import { ButtonHTMLAttributes, ReactNode } from 'react';

interface PermissionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  permission?: string;
  permissions?: string[];
  requireAll?: boolean;
  role?: string;
  children: ReactNode;
  disabledText?: string;
}

export function PermissionButton({
  permission,
  permissions,
  requireAll = false,
  role,
  children,
  disabledText,
  disabled,
  ...props
}: PermissionButtonProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions, hasRole } = useAuth();

  let hasAccess = true;

  if (role) {
    hasAccess = hasRole(role);
  } else if (permission) {
    hasAccess = hasPermission(permission);
  } else if (permissions && permissions.length > 0) {
    hasAccess = requireAll
      ? hasAllPermissions(permissions)
      : hasAnyPermission(permissions);
  }

  const isDisabled = disabled || !hasAccess;

  return (
    <button
      {...props}
      disabled={isDisabled}
      title={isDisabled && !hasAccess ? disabledText || 'Insufficient permissions' : undefined}
      className={`${props.className || ''} ${
        isDisabled ? 'opacity-50 cursor-not-allowed' : ''
      }`}
    >
      {children}
    </button>
  );
}

