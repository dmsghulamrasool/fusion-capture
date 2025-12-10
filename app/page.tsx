"use client";

import { PageTransition } from "@/components/ui/Loading";

// Home page is public and accessible to all users (authenticated and unauthenticated)
export default function Home() {
  return (
    <PageTransition>
      <div className=" bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-black mb-6">
              We are <span className="text-[#10b981]">Fusion Capture</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Building secure user-first experiences powered by SSO
              authentication and role-based access control.
            </p>
            <div className="flex gap-4 justify-center mb-16">
              <a
                href="/login"
                className="px-6 py-3 bg-[#10b981] text-white rounded-lg font-medium hover:bg-[#059669] transition-colors flex items-center gap-2"
              >
                <span>Get Started</span>
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </a>
              <a
                href="/dashboard"
                className="px-6 py-3 bg-white text-gray-700 border border-gray-200 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Learn More
              </a>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto mt-16">
              <div className="text-center">
                <div className="w-12 h-12 bg-[#10b981] rounded-lg flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>
                <h3 className="font-semibold text-black mb-2">Secure SSO</h3>
                <p className="text-sm text-gray-600">
                  Google & GitHub authentication
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-[#10b981] rounded-lg flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                </div>
                <h3 className="font-semibold text-black mb-2">
                  Role-Based Access
                </h3>
                <p className="text-sm text-gray-600">
                  Granular permission control
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-[#10b981] rounded-lg flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                </div>
                <h3 className="font-semibold text-black mb-2">
                  Protected Routes
                </h3>
                <p className="text-sm text-gray-600">Secure page access</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
