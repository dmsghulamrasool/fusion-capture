import { PageTransition } from "@/components/ui/Loading";

export default function UnauthorizedPage() {
  return (
    <PageTransition>
      <div className=" bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-black mb-4">403</h1>
          <h2 className="text-2xl font-semibold text-gray-700 mb-2">
            Unauthorized Access
          </h2>
          <p className="text-gray-600 mb-8">
            You don't have permission to access this resource.
          </p>
          <a
            href="/dashboard"
            className="inline-block px-6 py-3 bg-[#10b981] text-white rounded-lg font-medium hover:bg-[#059669] transition-colors"
          >
            Go to Dashboard
          </a>
        </div>
      </div>
    </PageTransition>
  );
}
