'use client';

import { useAuth } from '@/contexts/AuthContext';
import { signIn, signOut } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { RequirePermission } from '../auth/RequirePermission';
import { RequireRole } from '../auth/RequireRole';
import { LoadingSpinner } from '../ui/Loading';
import { useState } from 'react';
import { usePagePermissions } from '@/hooks/usePagePermissions';

export function Navbar() {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  // Check profile and blog page permissions
  const { permissions: profilePermissions, loading: profilePermissionsLoading } = usePagePermissions("/profile");
  const { permissions: blogPermissions, loading: blogPermissionsLoading } = usePagePermissions("/blog");

  const navItems = [
    {
      href: '/',
      label: 'Home',
      public: true,
    },
    {
      href: '/blog',
      label: 'Blog',
      public: true,
    },
    {
      href: '/dashboard',
      label: 'Dashboard',
      permission: 'viewer.dashboard',
    },
    {
      href: '/editor',
      label: 'Editor',
      permission: 'editor.dashboard',
    },
    {
      href: '/admin',
      label: 'Admin',
      permission: 'admin.dashboard',
    },
    {
      href: '/profile',
      label: 'Profile',
      requiresAuth: true,
    },
  ];

  if (loading) {
    return (
      <nav className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 md:h-20 items-center">
            <Link href="/" className="text-xl md:text-2xl font-bold text-black">
              <span className="text-black">Fusion</span>{" "}
              <span className="text-[#10b981]">Capture</span>
            </Link>
            <LoadingSpinner size="sm" />
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 md:h-20 items-center">
          <div className="flex items-center space-x-4 md:space-x-12">
            <Link href="/" className="text-xl md:text-2xl font-bold text-black">
              <span className="text-black">Fusion</span>{" "}
              <span className="text-[#10b981]">Capture</span>
            </Link>
            <div className="hidden md:flex space-x-6">
              {navItems.map((item) => {
                // Public items - Home always shows, Blog needs canView permission
                if (item.public) {
                  // Home is always public
                  if (item.href === '/') {
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`px-3 py-2 text-sm font-medium transition-colors ${
                          pathname === item.href
                            ? "text-[#10b981]"
                            : "text-gray-700 hover:text-[#10b981]"
                        }`}
                      >
                        {item.label}
                      </Link>
                    );
                  }
                  // Blog needs canView permission check
                  if (item.href === '/blog') {
                    if (blogPermissionsLoading) {
                      return null; // Don't show while loading
                    }
                    if (!blogPermissions.canView) {
                      return null; // Don't show if no view permission
                    }
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`px-3 py-2 text-sm font-medium transition-colors ${
                          pathname === item.href
                            ? "text-[#10b981]"
                            : "text-gray-700 hover:text-[#10b981]"
                        }`}
                      >
                        {item.label}
                      </Link>
                    );
                  }
                }

                // Items requiring auth - Profile needs canView permission
                if (item.requiresAuth) {
                  if (!user) {
                    return null;
                  }
                  // For profile, check if user has canView permission
                  if (item.href === '/profile') {
                    if (profilePermissionsLoading) {
                      return null; // Don't show while loading
                    }
                    if (!profilePermissions.canView) {
                      return null; // Don't show if no view permission
                    }
                  }
                }

                // Items requiring permission
                if (item.permission) {
                  return (
                    <RequirePermission
                      key={item.href}
                      permission={item.permission}
                      showFallback={false}
                    >
                      <Link
                        href={item.href}
                        className={`px-3 py-2 text-sm font-medium transition-colors ${
                          pathname === item.href
                            ? "text-[#10b981]"
                            : "text-gray-700 hover:text-[#10b981]"
                        }`}
                      >
                        {item.label}
                      </Link>
                    </RequirePermission>
                  );
                }

                // Default: show if authenticated
                if (user) {
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`px-3 py-2 text-sm font-medium transition-colors ${
                        pathname === item.href
                          ? "text-[#10b981]"
                          : "text-gray-700 hover:text-[#10b981]"
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                }

                return null;
              })}
            </div>
          </div>
          <div className="flex items-center space-x-2 md:space-x-4">
            {user ? (
              <>
                <span className="hidden md:inline text-sm text-gray-700 truncate max-w-[120px]">
                  {user.name || user.email}
                </span>
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="px-3 md:px-5 py-2 md:py-2.5 text-xs md:text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <span className="hidden sm:inline">Sign Out</span>
                  <span className="sm:hidden">Out</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => signIn()}
                className="px-3 md:px-5 py-2 md:py-2.5 text-xs md:text-sm font-medium text-white bg-[#10b981] rounded-lg hover:bg-[#059669] transition-colors flex items-center gap-1 md:gap-2"
              >
                <span>Sign In</span>
                <svg
                  className="w-3 h-3 md:w-4 md:h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            )}
            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
              aria-label="Toggle menu"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {mobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>
        
        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <div className="flex flex-col space-y-2">
              {navItems.map((item) => {
                // Public items - Home always shows, Blog needs canView permission
                if (item.public) {
                  // Home is always public
                  if (item.href === '/') {
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`px-4 py-2 text-sm font-medium transition-colors ${
                          pathname === item.href
                            ? "text-[#10b981] bg-gray-50"
                            : "text-gray-700 hover:text-[#10b981] hover:bg-gray-50"
                        }`}
                      >
                        {item.label}
                      </Link>
                    );
                  }
                  // Blog needs canView permission check
                  if (item.href === '/blog') {
                    if (blogPermissionsLoading) {
                      return null; // Don't show while loading
                    }
                    if (!blogPermissions.canView) {
                      return null; // Don't show if no view permission
                    }
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`px-4 py-2 text-sm font-medium transition-colors ${
                          pathname === item.href
                            ? "text-[#10b981] bg-gray-50"
                            : "text-gray-700 hover:text-[#10b981] hover:bg-gray-50"
                        }`}
                      >
                        {item.label}
                      </Link>
                    );
                  }
                }

                // Items requiring auth - Profile needs canView permission
                if (item.requiresAuth) {
                  if (!user) {
                    return null;
                  }
                  // For profile, check if user has canView permission
                  if (item.href === '/profile') {
                    if (profilePermissionsLoading) {
                      return null; // Don't show while loading
                    }
                    if (!profilePermissions.canView) {
                      return null; // Don't show if no view permission
                    }
                  }
                }

                // Items requiring permission
                if (item.permission) {
                  return (
                    <RequirePermission
                      key={item.href}
                      permission={item.permission}
                      showFallback={false}
                    >
                      <Link
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`px-4 py-2 text-sm font-medium transition-colors ${
                          pathname === item.href
                            ? "text-[#10b981] bg-gray-50"
                            : "text-gray-700 hover:text-[#10b981] hover:bg-gray-50"
                        }`}
                      >
                        {item.label}
                      </Link>
                    </RequirePermission>
                  );
                }

                // Default: show if authenticated
                if (user) {
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`px-4 py-2 text-sm font-medium transition-colors ${
                        pathname === item.href
                          ? "text-[#10b981] bg-gray-50"
                          : "text-gray-700 hover:text-[#10b981] hover:bg-gray-50"
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                }

                return null;
              })}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

