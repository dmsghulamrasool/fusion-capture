"use client";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { PERMISSIONS } from "@/lib/permissions";
import { useAuth } from "@/contexts/AuthContext";
import { PageTransition } from "@/components/ui/Loading";
import { usePagePermissions } from "@/hooks/usePagePermissions";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

function EditorContent() {
  const { user } = useAuth();
  const router = useRouter();
  const { permissions: pagePermissions, loading: permissionsLoading } = usePagePermissions("/editor");

  // Check page-level permission
  // Only redirect to unauthorized if user is authenticated but doesn't have permission
  // If user is not authenticated, ProtectedRoute will handle redirect to login
  useEffect(() => {
    if (!permissionsLoading && user && !pagePermissions.canView) {
      router.push("/unauthorized");
    }
  }, [permissionsLoading, pagePermissions.canView, router, user]);

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

  return (
    <PageTransition>
      <div className=" bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h1 className="text-4xl font-bold text-black mb-2">
            Editor Dashboard
          </h1>
          <p className="text-gray-600 mb-8">Create and manage content</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 border border-gray-200 rounded-lg hover:border-[#10b981] transition-colors">
              <h3 className="text-lg font-semibold text-black mb-4">
                Your Content
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Published</span>
                  <span className="font-semibold">42</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Drafts</span>
                  <span className="font-semibold">8</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Views</span>
                  <span className="font-semibold">1,234</span>
                </div>
              </div>
            </div>
            <div className="p-6 border border-gray-200 rounded-lg hover:border-[#10b981] transition-colors">
              <h3 className="text-lg font-semibold text-black mb-4">
                Quick Actions
              </h3>
              <div className="space-y-2">
                <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 rounded transition-colors">
                  Create New Post
                </button>
                <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 rounded transition-colors">
                  View All Posts
                </button>
                <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 rounded transition-colors">
                  Analytics
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}

export default function EditorPage() {
  return (
    <ProtectedRoute requiredPermission={PERMISSIONS.EDITOR_DASHBOARD}>
      <EditorContent />
    </ProtectedRoute>
  );
}
