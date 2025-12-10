'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { PageTransition } from '@/components/ui/Loading';
import { usePagePermissions } from '@/hooks/usePagePermissions';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

function DashboardContent() {
  const { user } = useAuth();
  const router = useRouter();
  const { permissions: pagePermissions, loading: permissionsLoading } = usePagePermissions("/dashboard");

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
          <h1 className="text-4xl font-bold text-black mb-2">Dashboard</h1>
          <p className="text-gray-600 mb-8">Welcome back, {user?.name || user?.email}</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 border border-gray-200 rounded-lg hover:border-[#10b981] transition-colors">
              <h3 className="text-lg font-semibold text-black mb-2">Total Users</h3>
              <p className="text-3xl font-bold text-[#10b981]">1,234</p>
            </div>
            <div className="p-6 border border-gray-200 rounded-lg hover:border-[#10b981] transition-colors">
              <h3 className="text-lg font-semibold text-black mb-2">Active Sessions</h3>
              <p className="text-3xl font-bold text-[#10b981]">567</p>
            </div>
            <div className="p-6 border border-gray-200 rounded-lg hover:border-[#10b981] transition-colors">
              <h3 className="text-lg font-semibold text-black mb-2">Your Role</h3>
              <p className="text-3xl font-bold text-[#10b981]">{user?.roles?.[0] || 'viewer'}</p>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}

