// Permission constants for easy reference
export const PERMISSIONS = {
  // Admin permissions
  ADMIN_DASHBOARD: "admin.dashboard",
  ADMIN_USERS: "admin.users",
  ADMIN_SETTINGS: "admin.settings",

  // Post permissions
  POSTS_READ: "posts.read",
  POSTS_WRITE: "posts.write",
  POSTS_DELETE: "posts.delete",

  // User permissions
  USERS_READ: "users.read",
  USERS_WRITE: "users.write",
  USERS_DELETE: "users.delete",

  // Dashboard permissions
  EDITOR_DASHBOARD: "editor.dashboard",
  VIEWER_DASHBOARD: "viewer.dashboard",
} as const;

// Role constants
export const ROLES = {
  ADMIN: "admin",
  EDITOR: "editor",
  VIEWER: "viewer",
} as const;

// Route permissions mapping
export const ROUTE_PERMISSIONS: Record<string, string[]> = {
  "/admin": [PERMISSIONS.ADMIN_DASHBOARD],
  "/editor": [PERMISSIONS.EDITOR_DASHBOARD],
  "/dashboard": [PERMISSIONS.VIEWER_DASHBOARD],
};
