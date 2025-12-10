"use client";

import React from "react";
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
  // Only redirect to unauthorized if user is authenticated but doesn't have permission
  // If user is not authenticated, ProtectedRoute will handle redirect to login
  useEffect(() => {
    if (!permissionsLoading && user && !pagePermissions.canView) {
      router.push("/unauthorized");
    }
  }, [permissionsLoading, pagePermissions.canView, router, user]);

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
                Configure module access for each role. Profile module supports View and Update permissions. Blog module supports View, Add, Update, and Delete permissions. Dashboard and Admin modules only support View access. Admin role has all permissions by default.
              </p>
            </div>

            {loadingAccess ? (
              <div className="p-8 text-center">
                <LoadingSpinner size="md" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                {(() => {
                  // Define modules (grouped pages)
                  const modules = [
                    { 
                      name: "Profile", 
                      pages: ["/profile"],
                      description: "User Profile"
                    },
                    { 
                      name: "Blog", 
                      pages: ["/blog", "/blog/create", "/blog/[id]", "/blog/[id]/edit"],
                      description: "Blog Management"
                    },
                    { 
                      name: "Dashboard", 
                      pages: ["/dashboard", "/editor"],
                      description: "User & Editor Dashboards"
                    },
                    { 
                      name: "Admin", 
                      pages: ["/admin"],
                      description: "Admin Dashboard"
                    },
                  ];

                  const roles = ["viewer", "editor", "admin"];

                  // Helper functions to check module permissions
                  const hasModulePermission = (
                    role: string,
                    modulePages: string[],
                    permission: "canView" | "canAdd" | "canEdit" | "canDelete"
                  ): boolean => {
                    if (role === "admin") return true; // Admin has all access
                    
                    // Check if all pages in the module have the permission enabled
                    return modulePages.every((pagePath) => {
                      const access = roleAccess[role]?.[pagePath];
                      if (permission === "canView") {
                        return access?.canView ?? true; // Default to true
                      }
                      return access?.[permission] ?? false; // Default to false for add/edit/delete
                    });
                  };

                  // Helper function to update module permission
                  const handleModulePermissionChange = async (
                    role: string,
                    modulePages: string[],
                    permission: "canView" | "canAdd" | "canEdit" | "canDelete",
                    value: boolean
                  ) => {
                    if (role === "admin") return; // Can't modify admin

                    // Set loading state
                    const firstPage = modulePages[0];
                    setUpdatingAccess(`${role}-${firstPage}-${permission}`);

                    try {
                      // Update all pages in the module
                      for (const pagePath of modulePages) {
                        const currentAccess = roleAccess[role]?.[pagePath] || {
                          canView: true,
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
                            page: pagePath,
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
                            "Error updating module permission:",
                            errorData.error || response.statusText
                          );
                          await fetchRoleAccess();
                          return;
                        }
                      }

                      // Refresh role access after all updates
                      await fetchRoleAccess();
                    } catch (error) {
                      console.error("Error updating module permission:", error);
                      await fetchRoleAccess();
                    } finally {
                      setUpdatingAccess(null);
                    }
                  };

                  // Modules that support full permissions (Add, Update, Delete)
                  const modulesWithFullPermissions = ["Blog"];
                  // Profile only has View and Update
                  const profileModule = "Profile";

                  return (
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th
                            rowSpan={2}
                            className="px-6 py-4 text-left text-sm font-semibold text-gray-900 uppercase tracking-wider border-r border-gray-200"
                          >
                            Role
                          </th>
                          {modules.map((module) => {
                            const hasFullPermissions =
                              modulesWithFullPermissions.includes(module.name);
                            const isProfile = module.name === profileModule;
                            const colSpan = hasFullPermissions ? 4 : isProfile ? 2 : 1;
                            return (
                              <th
                                key={module.name}
                                colSpan={colSpan}
                                className="px-6 py-4 text-center text-sm font-semibold text-gray-900 uppercase tracking-wider border-b border-gray-200"
                              >
                                <div>{module.name}</div>
                                <div className="text-xs font-normal text-gray-500 mt-1">
                                  {module.description}
                                </div>
                              </th>
                            );
                          })}
                        </tr>
                        <tr>
                          {modules.map((module) => {
                            const hasFullPermissions =
                              modulesWithFullPermissions.includes(module.name);
                            const isProfile = module.name === profileModule;
                            if (hasFullPermissions) {
                              return (
                                <React.Fragment key={module.name}>
                                  <th className="px-4 py-2 text-xs font-medium text-gray-600 uppercase tracking-wider">
                                    View
                                  </th>
                                  <th className="px-4 py-2 text-xs font-medium text-gray-600 uppercase tracking-wider">
                                    Add
                                  </th>
                                  <th className="px-4 py-2 text-xs font-medium text-gray-600 uppercase tracking-wider">
                                    Update
                                  </th>
                                  <th className="px-4 py-2 text-xs font-medium text-gray-600 uppercase tracking-wider">
                                    Delete
                                  </th>
                                </React.Fragment>
                              );
                            } else if (isProfile) {
                              return (
                                <React.Fragment key={module.name}>
                                  <th className="px-4 py-2 text-xs font-medium text-gray-600 uppercase tracking-wider">
                                    View
                                  </th>
                                  <th className="px-4 py-2 text-xs font-medium text-gray-600 uppercase tracking-wider">
                                    Update
                                  </th>
                                </React.Fragment>
                              );
                            } else {
                              return (
                                <th
                                  key={module.name}
                                  className="px-4 py-2 text-xs font-medium text-gray-600 uppercase tracking-wider"
                                >
                                  View
                                </th>
                              );
                            }
                          })}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {roles.map((role) => (
                          <tr key={role} className="hover:bg-gray-50">
                            <td
                              rowSpan={1}
                              className="px-6 py-4 whitespace-nowrap border-r border-gray-200"
                            >
                              <div className="flex items-center">
                                <span
                                  className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${
                                    role === "admin"
                                      ? "bg-purple-100 text-purple-800"
                                      : role === "editor"
                                      ? "bg-green-100 text-green-800"
                                      : "bg-blue-100 text-blue-800"
                                  }`}
                                >
                                  {role.charAt(0).toUpperCase() + role.slice(1)}
                                </span>
                              </div>
                            </td>
                            {modules.map((module) => {
                              const hasFullPermissions =
                                modulesWithFullPermissions.includes(module.name);
                              const isProfile = module.name === profileModule;
                              const isUpdating = (permission: string) =>
                                module.pages.some(
                                  (pagePath) =>
                                    updatingAccess ===
                                    `${role}-${pagePath}-${permission}`
                                );

                              if (hasFullPermissions) {
                                // Blog module - View, Add, Update, Delete
                                return (
                                  <React.Fragment key={`${role}-${module.name}`}>
                                    {/* View */}
                                    <td className="px-4 py-4 whitespace-nowrap text-center">
                                      <div className="flex items-center justify-center gap-2">
                                        <input
                                          type="checkbox"
                                          checked={hasModulePermission(
                                            role,
                                            module.pages,
                                            "canView"
                                          )}
                                          onChange={(e) =>
                                            handleModulePermissionChange(
                                              role,
                                              module.pages,
                                              "canView",
                                              e.target.checked
                                            )
                                          }
                                          disabled={
                                            role === "admin" ||
                                            isUpdating("canView")
                                          }
                                          className="h-5 w-5 text-[#10b981] focus:ring-[#10b981] border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                        />
                                        {isUpdating("canView") && (
                                          <LoadingSpinner size="sm" />
                                        )}
                                      </div>
                                    </td>
                                    {/* Add */}
                                    <td className="px-4 py-4 whitespace-nowrap text-center">
                                      <div className="flex items-center justify-center gap-2">
                                        <input
                                          type="checkbox"
                                          checked={hasModulePermission(
                                            role,
                                            module.pages,
                                            "canAdd"
                                          )}
                                          onChange={(e) =>
                                            handleModulePermissionChange(
                                              role,
                                              module.pages,
                                              "canAdd",
                                              e.target.checked
                                            )
                                          }
                                          disabled={
                                            role === "admin" ||
                                            isUpdating("canAdd")
                                          }
                                          className="h-5 w-5 text-[#10b981] focus:ring-[#10b981] border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                        />
                                        {isUpdating("canAdd") && (
                                          <LoadingSpinner size="sm" />
                                        )}
                                      </div>
                                    </td>
                                    {/* Update */}
                                    <td className="px-4 py-4 whitespace-nowrap text-center">
                                      <div className="flex items-center justify-center gap-2">
                                        <input
                                          type="checkbox"
                                          checked={hasModulePermission(
                                            role,
                                            module.pages,
                                            "canEdit"
                                          )}
                                          onChange={(e) =>
                                            handleModulePermissionChange(
                                              role,
                                              module.pages,
                                              "canEdit",
                                              e.target.checked
                                            )
                                          }
                                          disabled={
                                            role === "admin" ||
                                            isUpdating("canEdit")
                                          }
                                          className="h-5 w-5 text-[#10b981] focus:ring-[#10b981] border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                        />
                                        {isUpdating("canEdit") && (
                                          <LoadingSpinner size="sm" />
                                        )}
                                      </div>
                                    </td>
                                    {/* Delete */}
                                    <td className="px-4 py-4 whitespace-nowrap text-center">
                                      <div className="flex items-center justify-center gap-2">
                                        <input
                                          type="checkbox"
                                          checked={hasModulePermission(
                                            role,
                                            module.pages,
                                            "canDelete"
                                          )}
                                          onChange={(e) =>
                                            handleModulePermissionChange(
                                              role,
                                              module.pages,
                                              "canDelete",
                                              e.target.checked
                                            )
                                          }
                                          disabled={
                                            role === "admin" ||
                                            isUpdating("canDelete")
                                          }
                                          className="h-5 w-5 text-[#10b981] focus:ring-[#10b981] border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                        />
                                        {isUpdating("canDelete") && (
                                          <LoadingSpinner size="sm" />
                                        )}
                                      </div>
                                    </td>
                                  </React.Fragment>
                                );
                              } else if (isProfile) {
                                // Profile module - View and Update only
                                return (
                                  <React.Fragment key={`${role}-${module.name}`}>
                                    {/* View */}
                                    <td className="px-4 py-4 whitespace-nowrap text-center">
                                      <div className="flex items-center justify-center gap-2">
                                        <input
                                          type="checkbox"
                                          checked={hasModulePermission(
                                            role,
                                            module.pages,
                                            "canView"
                                          )}
                                          onChange={(e) =>
                                            handleModulePermissionChange(
                                              role,
                                              module.pages,
                                              "canView",
                                              e.target.checked
                                            )
                                          }
                                          disabled={
                                            role === "admin" ||
                                            isUpdating("canView")
                                          }
                                          className="h-5 w-5 text-[#10b981] focus:ring-[#10b981] border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                        />
                                        {isUpdating("canView") && (
                                          <LoadingSpinner size="sm" />
                                        )}
                                      </div>
                                    </td>
                                    {/* Update */}
                                    <td className="px-4 py-4 whitespace-nowrap text-center">
                                      <div className="flex items-center justify-center gap-2">
                                        <input
                                          type="checkbox"
                                          checked={hasModulePermission(
                                            role,
                                            module.pages,
                                            "canEdit"
                                          )}
                                          onChange={(e) =>
                                            handleModulePermissionChange(
                                              role,
                                              module.pages,
                                              "canEdit",
                                              e.target.checked
                                            )
                                          }
                                          disabled={
                                            role === "admin" ||
                                            isUpdating("canEdit")
                                          }
                                          className="h-5 w-5 text-[#10b981] focus:ring-[#10b981] border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                        />
                                        {isUpdating("canEdit") && (
                                          <LoadingSpinner size="sm" />
                                        )}
                                      </div>
                                    </td>
                                  </React.Fragment>
                                );
                              } else {
                                // Only View for Dashboard and Admin modules
                                return (
                                  <td
                                    key={`${role}-${module.name}`}
                                    className="px-4 py-4 whitespace-nowrap text-center"
                                  >
                                    <div className="flex items-center justify-center gap-2">
                                      <input
                                        type="checkbox"
                                        checked={hasModulePermission(
                                          role,
                                          module.pages,
                                          "canView"
                                        )}
                                        onChange={(e) =>
                                          handleModulePermissionChange(
                                            role,
                                            module.pages,
                                            "canView",
                                            e.target.checked
                                          )
                                        }
                                        disabled={
                                          role === "admin" ||
                                          isUpdating("canView")
                                        }
                                        className="h-5 w-5 text-[#10b981] focus:ring-[#10b981] border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                      />
                                      {isUpdating("canView") && (
                                        <LoadingSpinner size="sm" />
                                      )}
                                    </div>
                                  </td>
                                );
                              }
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  );
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
                    <strong>Admin role</strong> has all permissions for all modules by default and cannot be modified.
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
