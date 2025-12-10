import connectMongoose from './mongoose';
import UserRole from '@/models/UserRole';
import RoleAccess from '@/models/RoleAccess';

// Define roles and their permissions
export const ROLE_PERMISSIONS: Record<string, string[]> = {
  admin: [
    'admin.dashboard',
    'admin.users',
    'admin.settings',
    'posts.read',
    'posts.write',
    'posts.delete',
    'users.read',
    'users.write',
    'users.delete',
    'editor.dashboard',
    'viewer.dashboard',
  ],
  editor: [
    'posts.read',
    'posts.write',
    'posts.delete',
    'users.read',
    'editor.dashboard',
    'viewer.dashboard',
  ],
  viewer: [
    'posts.read',
    'users.read',
    'viewer.dashboard',
  ],
};

// Default role for new users
const DEFAULT_ROLE = 'viewer';

export interface UserPermissions {
  roles: string[];
  permissions: string[];
}

/**
 * Assign roles and permissions to a user
 * If user doesn't exist in roles collection, assign default role
 */
export async function assignRolesAndPermissions(
  userId: string
): Promise<UserPermissions> {
  // Connect to MongoDB using Mongoose
  await connectMongoose();
  
  // Normalize userId to string
  const userIdStr = userId.toString();
  
  // Check if user exists in roles collection
  let userRole = await UserRole.findOne({
    userId: userIdStr,
  });

  let roles: string[] = [];
  
  if (userRole) {
    roles = userRole.roles || [];
  } else {
    // Assign default role for new user
    roles = [DEFAULT_ROLE];
    userRole = await UserRole.create({
      userId: userIdStr,
      roles: roles,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  // Get all permissions for user's roles
  const permissions = new Set<string>();
  roles.forEach((role) => {
    const rolePerms = ROLE_PERMISSIONS[role] || [];
    rolePerms.forEach((perm) => permissions.add(perm));
  });

  return {
    roles,
    permissions: Array.from(permissions),
  };
}

/**
 * Get user roles and permissions
 */
export async function getUserPermissions(
  userId: string
): Promise<UserPermissions> {
  return assignRolesAndPermissions(userId);
}

/**
 * Check if user has a specific role
 */
export function hasRole(userRoles: string[], requiredRole: string): boolean {
  return userRoles.includes(requiredRole);
}

/**
 * Check if user has a specific permission
 * Admin role automatically has all permissions
 */
export function hasPermission(
  userPermissions: string[],
  requiredPermission: string,
  userRoles?: string[]
): boolean {
  // Admin has all permissions
  if (userRoles && userRoles.includes('admin')) {
    return true;
  }
  return userPermissions.includes(requiredPermission);
}

/**
 * Check if user has any of the required permissions
 * Admin role automatically has all permissions
 */
export function hasAnyPermission(
  userPermissions: string[],
  requiredPermissions: string[],
  userRoles?: string[]
): boolean {
  // Admin has all permissions
  if (userRoles && userRoles.includes('admin')) {
    return true;
  }
  return requiredPermissions.some((perm) => userPermissions.includes(perm));
}

/**
 * Check if user has all required permissions
 * Admin role automatically has all permissions
 */
export function hasAllPermissions(
  userPermissions: string[],
  requiredPermissions: string[],
  userRoles?: string[]
): boolean {
  // Admin has all permissions
  if (userRoles && userRoles.includes('admin')) {
    return true;
  }
  return requiredPermissions.every((perm) => userPermissions.includes(perm));
}

/**
 * Setup demo users with different roles
 * Call this function to initialize demo users
 */
export async function setupDemoUsers() {
  await connectMongoose();
  // This will be called manually or via an API route
  // For now, we'll create a script to assign roles to users by email
  console.log('Demo users setup - assign roles via API or manually');
}

/**
 * Check if user has page-level permission (can_view, can_add, can_edit, can_delete)
 * Admin role automatically has all permissions
 * This function uses the RoleAccess model for granular page-level permissions
 */
export async function hasPagePermission(
  userId: string,
  page: string,
  permission: 'canView' | 'canAdd' | 'canEdit' | 'canDelete'
): Promise<boolean> {
  await connectMongoose();
  
  // Get user roles
  const userIdStr = userId.toString();
  const userRole = await UserRole.findOne({ userId: userIdStr });
  
  if (!userRole || !userRole.roles || userRole.roles.length === 0) {
    return false;
  }
  
  const roles = userRole.roles;
  
  // Admin has all permissions
  if (roles.includes('admin')) {
    return true;
  }
  
  // Check page-level permissions for each role
  // User needs at least one role with the permission
  for (const role of roles) {
    const roleAccess = await RoleAccess.findOne({ role, page });
    
    // Handle defaults based on permission type
    if (permission === 'canView') {
      // canView defaults to true if not set
      if (!roleAccess) {
        return true; // Default to true
      }
      return roleAccess.canView ?? true; // Default to true if undefined
    } else {
      // For other permissions (canAdd, canEdit, canDelete), check the value
      // Profile page: canEdit defaults to true, others default to false
      const isProfilePage = page === '/profile';
      if (!roleAccess) {
        if (isProfilePage && permission === 'canEdit') {
          return true; // Profile canEdit defaults to true
        }
        return false; // Other permissions default to false
      }
      
      // Check the permission value, with defaults
      if (isProfilePage && permission === 'canEdit') {
        return roleAccess.canEdit ?? true; // Profile canEdit defaults to true
      }
      
      return roleAccess[permission] ?? false; // Default to false
    }
  }
  
  return false;
}

/**
 * Get all page-level permissions for a user
 * Returns an object with page paths as keys and permission objects as values
 * Admin role automatically has all permissions for all pages
 */
export async function getUserPagePermissions(
  userId: string
): Promise<Record<string, { canView: boolean; canAdd: boolean; canEdit: boolean; canDelete: boolean }>> {
  await connectMongoose();
  
  const userIdStr = userId.toString();
  const userRole = await UserRole.findOne({ userId: userIdStr });
  
  if (!userRole || !userRole.roles || userRole.roles.length === 0) {
    return {};
  }
  
  const roles = userRole.roles;
  
  // Admin has all permissions
  if (roles.includes('admin')) {
    // Return all pages with all permissions set to true
    // This would need to be populated from available pages
    // For now, return empty object and let the caller handle it
    return {};
  }
  
  // Get all role access records for user's roles
  const roleAccesses = await RoleAccess.find({
    role: { $in: roles },
  }).lean();
  
  // Combine permissions from all roles (OR logic - if any role has permission, user has it)
  const pagePermissions: Record<string, { canView: boolean; canAdd: boolean; canEdit: boolean; canDelete: boolean }> = {};
  
  roleAccesses.forEach((access) => {
    if (!pagePermissions[access.page]) {
      pagePermissions[access.page] = {
        canView: false,
        canAdd: false,
        canEdit: false,
        canDelete: false,
      };
    }
    
    // OR logic: if any role has permission, user has it
    pagePermissions[access.page].canView = pagePermissions[access.page].canView || access.canView;
    pagePermissions[access.page].canAdd = pagePermissions[access.page].canAdd || access.canAdd;
    pagePermissions[access.page].canEdit = pagePermissions[access.page].canEdit || access.canEdit;
    pagePermissions[access.page].canDelete = pagePermissions[access.page].canDelete || access.canDelete;
  });
  
  return pagePermissions;
}

