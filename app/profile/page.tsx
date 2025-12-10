"use client";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { signOut } from "next-auth/react";
import { PageTransition } from "@/components/ui/Loading";
import { usePagePermissions } from "@/hooks/usePagePermissions";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

function ProfileContent() {
  const { user } = useAuth();
  const router = useRouter();
  const { permissions: pagePermissions, loading: permissionsLoading } = usePagePermissions("/profile");
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || "");
  const [saving, setSaving] = useState(false);

  // Check page-level permission - Profile requires View access
  // Only redirect to unauthorized if user is authenticated but doesn't have permission
  // If user is not authenticated, ProtectedRoute will handle redirect to login
  useEffect(() => {
    if (!permissionsLoading && user && !pagePermissions.canView) {
      router.push("/unauthorized");
    }
  }, [permissionsLoading, pagePermissions.canView, router, user]);

  // Update name when user changes
  useEffect(() => {
    if (user?.name) {
      setName(user.name);
    }
  }, [user?.name]);

  // Don't render if user doesn't have view permission
  if (permissionsLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!pagePermissions.canView) {
    return null;
  }

  // Check if user has Update permission (canEdit)
  const canUpdate = pagePermissions.canEdit;

  return (
    <PageTransition>
      <div className=" bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-black mb-2">Profile</h1>
            <p className="text-gray-600">Manage your account settings</p>
          </div>

          {/* Profile Header */}
          <div className="bg-white border border-gray-200 rounded-lg p-8 mb-6">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-full bg-[#10b981] flex items-center justify-center text-white text-xl font-bold">
                {(() => {
                  const name = user?.name || user?.email || "U";
                  const parts = name.split(" ");
                  if (parts.length >= 2) {
                    // First letter of first name + first letter of last name
                    return (
                      parts[0][0] + parts[parts.length - 1][0]
                    ).toUpperCase();
                  } else {
                    // If only one word, take first 2 characters
                    return name.substring(0, 2).toUpperCase();
                  }
                })()}
              </div>

              <div className="flex-1">
                <h2 className="text-2xl font-bold text-black mb-1">
                  {user?.name || "User"}
                </h2>
                <p className="text-gray-600">{user?.email}</p>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>

          {/* Account Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-black">
                  Account Details
                </h3>
                {canUpdate && (
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="px-4 py-2 text-sm font-medium text-[#10b981] border border-[#10b981] rounded-lg hover:bg-[#10b981] hover:text-white transition-colors"
                  >
                    {isEditing ? "Cancel" : "Edit"}
                  </button>
                )}
              </div>
              {isEditing && canUpdate ? (
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    setSaving(true);
                    // In a real app, you would call an API to update the name
                    // For now, we'll just show a message
                    setTimeout(() => {
                      setSaving(false);
                      setIsEditing(false);
                      alert("Profile updated successfully!");
                    }, 500);
                  }}
                  className="space-y-4"
                >
                  <div>
                    <label className="text-xs text-gray-500 uppercase tracking-wide block mb-2">
                      Name
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#10b981] focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 uppercase tracking-wide block mb-2">
                      Email
                    </span>
                    <p className="text-black font-medium text-sm">
                      {user?.email || "N/A"} (cannot be changed)
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 uppercase tracking-wide block mb-2">
                      User ID
                    </span>
                    <p className="text-black font-medium mt-1 text-sm font-mono">
                      {user?.id || "N/A"}
                    </p>
                  </div>
                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full px-4 py-2 bg-[#10b981] text-white rounded-lg font-medium hover:bg-[#059669] transition-colors disabled:opacity-50"
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </form>
              ) : (
                <div className="space-y-4">
                  <div>
                    <span className="text-xs text-gray-500 uppercase tracking-wide">
                      Name
                    </span>
                    <p className="text-black font-medium mt-1">
                      {user?.name || "N/A"}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 uppercase tracking-wide">
                      Email
                    </span>
                    <p className="text-black font-medium mt-1">
                      {user?.email || "N/A"}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 uppercase tracking-wide">
                      User ID
                    </span>
                    <p className="text-black font-medium mt-1 text-sm font-mono">
                      {user?.id || "N/A"}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-black mb-4">
                Access Level
              </h3>
              <div className="space-y-4">
                <div>
                  <span className="text-xs text-gray-500 uppercase tracking-wide">
                    Current Role
                  </span>
                  <div className="mt-2">
                    {user?.roles?.map((role) => (
                      <span
                        key={role}
                        className="inline-block px-3 py-1 bg-[#10b981] text-white text-sm font-medium rounded-full mr-2"
                      >
                        {role}
                      </span>
                    )) || (
                      <span className="inline-block px-3 py-1 bg-gray-200 text-gray-700 text-sm font-medium rounded-full">
                        viewer
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <span className="text-xs text-gray-500 uppercase tracking-wide">
                    Total Permissions
                  </span>
                  <p className="text-black font-medium mt-1 text-2xl">
                    {user?.permissions?.length || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Permissions List */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-black mb-4">
              Your Permissions
            </h3>
            {user?.permissions && user.permissions.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {user.permissions.map((permission) => (
                  <span
                    key={permission}
                    className="px-3 py-1.5 bg-gray-50 text-gray-700 text-xs font-medium rounded border border-gray-200"
                  >
                    {permission}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No permissions assigned</p>
            )}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfileContent />
    </ProtectedRoute>
  );
}
