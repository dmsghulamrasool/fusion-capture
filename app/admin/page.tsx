"use client";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { PERMISSIONS } from "@/lib/permissions";
import { useAuth } from "@/contexts/AuthContext";
import { PageTransition } from "@/components/ui/Loading";
import { useEffect, useState } from "react";
import { LoadingSpinner } from "@/components/ui/Loading";
import { usePagePermissions } from "@/hooks/usePagePermissions";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  email: string;
  name: string;
  roles: string[];
}

interface PageAccess {
  page: string;
  pageName: string;
  canView: boolean;
  canAdd: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

interface RoleAccessData {
  [role: string]: {
    [page: string]: PageAccess;
  };
}

function AdminContent() {
  const { user } = useAuth();
  const router = useRouter();
  const { permissions: pagePermissions, loading: permissionsLoading } = usePagePermissions("/admin");
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [roleAccess, setRoleAccess] = useState<RoleAccessData>({});
  const [availablePages, setAvailablePages] = useState<Array<{ path: string; name: string }>>([]);
  const [loadingAccess, setLoadingAccess] = useState(true);
  const [updatingAccess, setUpdatingAccess] = useState<string | null>(null);

  // Check page-level permission
  useEffect(() => {
    if (!permissionsLoading && !pagePermissions.canView) {
      router.push("/unauthorized");
    }
  }, [permissionsLoading, pagePermissions.canView, router]);

  useEffect(() => {
    fetchUsers();
    fetchRoleAccess();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/users", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Include cookies for authentication
        cache: "no-store",
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Unknown error" }));
        console.error(
          "Error fetching users:",
          errorData.error || response.statusText,
          response.status
        );
        // Don't show alert, just log the error
        setUsers([]);
        return;
      }

      const data = await response.json();
      console.log("Fetched users response:", data); // Debug log

      if (data.users && Array.isArray(data.users)) {
        console.log("Setting users:", data.users.length);
        setUsers(data.users);
      } else {
        console.error("Invalid response format:", data);
        setUsers([]);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      // Don't show alert, just log the error
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoleAccess = async () => {
    try {
      setLoadingAccess(true);
      const response = await fetch("/api/role-access", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        cache: "no-store",
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Unknown error" }));
        console.error(
          "Error fetching role access:",
          errorData.error || response.statusText
        );
        setRoleAccess({});
        return;
      }

      const data = await response.json();
      console.log("Role access data:", data); // Debug log
      if (data.success && data.roleAccess) {
        setRoleAccess(data.roleAccess);
        if (data.pages && Array.isArray(data.pages) && data.pages.length > 0) {
          setAvailablePages(data.pages);
        } else {
          // Fallback: extract pages from roleAccess data
          const pagesFromData = Object.keys(data.roleAccess["editor"] || data.roleAccess["viewer"] || data.roleAccess["admin"] || {});
          if (pagesFromData.length > 0) {
            setAvailablePages(pagesFromData.map(path => ({ 
              path, 
              name: data.roleAccess["editor"]?.[path]?.pageName || 
                   data.roleAccess["viewer"]?.[path]?.pageName || 
                   data.roleAccess["admin"]?.[path]?.pageName || 
                   path 
            })));
          }
        }
      } else {
        console.error("Invalid response format:", data);
        setRoleAccess({});
        setAvailablePages([]);
      }
    } catch (error) {
      console.error("Error fetching role access:", error);
      setRoleAccess({});
    } finally {
      setLoadingAccess(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    if (!userId || !newRole) {
      console.error("Invalid user or role");
      return;
    }

    setUpdating(userId);
    try {
      const response = await fetch(`/api/users/${userId}/role`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Unknown error" }));
        console.error(
          "Error updating role:",
          errorData.error || response.statusText
        );
        return;
      }

      const data = await response.json();
      if (data.success) {
        // Refresh users list silently
        await fetchUsers();
        window.location.reload();
      } else {
        console.error("Failed to update role:", data.error);
      }
    } catch (error) {
      console.error("Error updating role:", error);
    } finally {
      setUpdating(null);
    }
  };

  const handleAccessChange = async (
    role: string,
    page: string,
    permission: string,
    value: boolean
  ) => {
    // Prevent modifying admin role
    if (role === "admin") {
      return;
    }

    const updateKey = `${role}-${page}-${permission}`;
    setUpdatingAccess(updateKey);

    try {
      const currentAccess = roleAccess[role]?.[page] || {
        canView: false,
        canAdd: false,
        canEdit: false,
        canDelete: false,
      };

      const updatedAccess = {
        ...currentAccess,
        [permission]: value,
      };

      const response = await fetch("/api/role-access", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          role,
          page,
          canView: updatedAccess.canView,
          canAdd: updatedAccess.canAdd,
          canEdit: updatedAccess.canEdit,
          canDelete: updatedAccess.canDelete,
        }),
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Unknown error" }));
        console.error(
          "Error updating access:",
          errorData.error || response.statusText
        );
        // Revert the change
        await fetchRoleAccess();
        return;
      }

      const data = await response.json();
      if (data.success) {
        // Refresh role access
        await fetchRoleAccess();
      } else {
        console.error("Failed to update access:", data.error);
        await fetchRoleAccess();
      }
    } catch (error) {
      console.error("Error updating access:", error);
      await fetchRoleAccess();
    } finally {
      setUpdatingAccess(null);
    }
  };

  if (loading || permissionsLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <LoadingSpinner size="md" />
      </div>
    );
  }

  // Don't render if user doesn't have view permission
  if (!pagePermissions.canView) {
    return null;
  }

  const totalUsers = users.length;
  const adminUsers = users.filter((u) => u.roles.includes("admin")).length;
  const editorUsers = users.filter((u) => u.roles.includes("editor")).length;
  const viewerUsers = users.filter((u) => u.roles.includes("viewer")).length;

  return (
    <PageTransition>
      <div className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h1 className="text-4xl font-bold text-black mb-2">
            Admin Dashboard
          </h1>
          <p className="text-gray-600 mb-8">Manage users and system settings</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="p-6 border border-gray-200 rounded-lg hover:border-[#10b981] transition-colors">
              <h3 className="text-lg font-semibold text-black mb-4">
                System Overview
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Users</span>
                  <span className="font-semibold">{totalUsers}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Admin Users</span>
                  <span className="font-semibold">{adminUsers}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Editor Users</span>
                  <span className="font-semibold">{editorUsers}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Viewer Users</span>
                  <span className="font-semibold">{viewerUsers}</span>
                </div>
              </div>
            </div>
          </div>

          {/* User Role Management */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-black">
                User Role Management
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Change user roles. Changes take effect after user signs out and
                signs in again.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Current Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Change Role
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-6 py-4 text-center text-gray-500"
                      >
                        {loading ? (
                          <LoadingSpinner size="sm" />
                        ) : (
                          "No users found. Users will appear here after they sign in."
                        )}
                      </td>
                    </tr>
                  ) : (
                    users.map((userItem) => (
                      <tr key={userItem.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {userItem.name || "N/A"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {userItem.email}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              userItem.roles[0] === "admin"
                                ? "bg-purple-100 text-purple-800"
                                : userItem.roles[0] === "editor"
                                ? "bg-green-100 text-green-800"
                                : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {userItem.roles[0] || "viewer"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <select
                              value={userItem.roles[0] || "viewer"}
                              onChange={(e) => {
                                const newRole = e.target.value;
                                if (
                                  confirm(
                                    `Are you sure you want to change ${
                                      userItem.name || userItem.email
                                    }'s role to ${newRole}?`
                                  )
                                ) {
                                  handleRoleChange(userItem.id, newRole);
                                } else {
                                  // Reset select to original value
                                  e.target.value =
                                    userItem.roles[0] || "viewer";
                                }
                              }}
                              disabled={updating === userItem.id}
                              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#10b981] focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed bg-white"
                            >
                              <option value="viewer">Viewer</option>
                              <option value="editor">Editor</option>
                              <option value="admin">Admin</option>
                            </select>
                            {updating === userItem.id && (
                              <LoadingSpinner size="sm" />
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Role Access Management */}
          <div className="mt-8 bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-black">
                Role Access Management
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Configure page-level permissions for Editor and Viewer roles. Admin role has all permissions by default. All roles have view access by default, and Profile page has full permissions for everyone.
              </p>
            </div>

            {loadingAccess ? (
              <div className="p-8 text-center">
                <LoadingSpinner size="md" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                {(() => {
                  // Use availablePages from API or extract from roleAccess
                  const pages = availablePages.length > 0 
                    ? availablePages.map(p => p.path)
                    : Object.keys(roleAccess["editor"] || roleAccess["viewer"] || roleAccess["admin"] || {});
                  
                  if (pages.length === 0) {
                    return (
                      <div className="p-8 text-center text-gray-500">
                        No role access data available
                      </div>
                    );
                  }

                  // Group by roles
                  return ["editor", "viewer"].map((role) => (
                    <div key={role} className="mb-8">
                      {/* Role Header */}
                      <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
                        <h3 className="text-lg font-semibold text-black">
                          <span
                            className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full mr-3 ${
                              role === "editor"
                                ? "bg-green-100 text-green-800"
                                : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {role.charAt(0).toUpperCase() + role.slice(1)} Role
                          </span>
                          <span className="text-sm text-gray-600 font-normal">
                            Configure permissions for {role} role
                          </span>
                        </h3>
                      </div>

                      {/* Role Permissions Table */}
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10">
                              Page
                            </th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Can View
                            </th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Can Add
                            </th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Can Edit
                            </th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Can Delete
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {pages.map((pagePath) => {
                            // Get page name from API response or from roleAccess data
                            const pageName = availablePages.find(p => p.path === pagePath)?.name ||
                              roleAccess["editor"]?.[pagePath]?.pageName ||
                              roleAccess["viewer"]?.[pagePath]?.pageName ||
                              roleAccess["admin"]?.[pagePath]?.pageName ||
                              pagePath;

                            // Get access from API response (which includes defaults)
                            const access = roleAccess[role]?.[pagePath] || {
                              canView: true, // Default from API
                              canAdd: pagePath === "/profile" ? true : false, // Profile defaults to true
                              canEdit: pagePath === "/profile" ? true : false, // Profile defaults to true
                              canDelete: pagePath === "/profile" ? true : false, // Profile defaults to true
                            };

                            return (
                              <tr key={`${role}-${pagePath}`} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap sticky left-0 bg-white z-10">
                                  <div className="text-sm font-medium text-gray-900">
                                    {pageName}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {pagePath}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                  <input
                                    type="checkbox"
                                    checked={access.canView}
                                    onChange={(e) =>
                                      handleAccessChange(
                                        role,
                                        pagePath,
                                        "canView",
                                        e.target.checked
                                      )
                                    }
                                    disabled={
                                      role === "admin" ||
                                      updatingAccess ===
                                        `${role}-${pagePath}-canView`
                                    }
                                    className="h-4 w-4 text-[#10b981] focus:ring-[#10b981] border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                                  />
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                  <input
                                    type="checkbox"
                                    checked={access.canAdd}
                                    onChange={(e) =>
                                      handleAccessChange(
                                        role,
                                        pagePath,
                                        "canAdd",
                                        e.target.checked
                                      )
                                    }
                                    disabled={
                                      role === "admin" ||
                                      updatingAccess === `${role}-${pagePath}-canAdd`
                                    }
                                    className="h-4 w-4 text-[#10b981] focus:ring-[#10b981] border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                                  />
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                  <input
                                    type="checkbox"
                                    checked={access.canEdit}
                                    onChange={(e) =>
                                      handleAccessChange(
                                        role,
                                        pagePath,
                                        "canEdit",
                                        e.target.checked
                                      )
                                    }
                                    disabled={
                                      role === "admin" ||
                                      updatingAccess ===
                                        `${role}-${pagePath}-canEdit`
                                    }
                                    className="h-4 w-4 text-[#10b981] focus:ring-[#10b981] border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                                  />
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                  <input
                                    type="checkbox"
                                    checked={access.canDelete}
                                    onChange={(e) =>
                                      handleAccessChange(
                                        role,
                                        pagePath,
                                        "canDelete",
                                        e.target.checked
                                      )
                                    }
                                    disabled={
                                      role === "admin" ||
                                      updatingAccess ===
                                        `${role}-${pagePath}-canDelete`
                                    }
                                    className="h-4 w-4 text-[#10b981] focus:ring-[#10b981] border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                                  />
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ));
                })()}
              </div>
            )}

            {/* Admin Role Info */}
            <div className="px-6 py-4 bg-purple-50 border-t border-gray-200">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                    Admin
                  </span>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-purple-800">
                    <strong>Admin role</strong> has all permissions (can_view, can_add, can_edit, can_delete) for all pages by default and cannot be modified.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">
              Important Notes:
            </h3>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li>Only admins can change user roles and manage role access</li>
              <li>
                Users need to sign out and sign in again for role changes to
                take effect
              </li>
              <li>Admin role has access to all pages and permissions by default</li>
              <li>Editor and Viewer role permissions can be customized per page</li>
              <li>Role access changes take effect immediately for new sessions</li>
            </ul>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}

export default function AdminPage() {
  return (
    <ProtectedRoute requiredPermission={PERMISSIONS.ADMIN_DASHBOARD}>
      <AdminContent />
    </ProtectedRoute>
  );
}
