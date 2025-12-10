"use client";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { PageTransition } from "@/components/ui/Loading";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { usePagePermissions } from "@/hooks/usePagePermissions";
import { useAuth } from "@/contexts/AuthContext";

function CreatePostContent() {
  const router = useRouter();
  const { user } = useAuth();
  const { permissions: pagePermissions, loading: permissionsLoading } = usePagePermissions("/blog/create");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  // Check page-level permission
  // Only redirect to unauthorized if user is authenticated but doesn't have permission
  // If user is not authenticated, ProtectedRoute will handle redirect to login
  useEffect(() => {
    if (!permissionsLoading && user && !pagePermissions.canAdd) {
      router.push("/unauthorized");
    }
  }, [permissionsLoading, pagePermissions.canAdd, router, user]);

  // Don't render if user doesn't have add permission
  if (permissionsLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!pagePermissions.canAdd) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/blog", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Include cookies for authentication
        body: JSON.stringify({ title, content, published: false }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.post && data.post._id) {
          router.push(`/blog/${data.post._id}`);
        } else {
          console.error("Invalid response format:", data);
          alert("Post created but invalid response format");
        }
      } else {
        const error = await response
          .json()
          .catch(() => ({ error: "Unknown error" }));
        console.error("Error creating post:", error);
        alert(error.error || "Failed to create post");
      }
    } catch (error) {
      console.error("Error creating post:", error);
      alert("Error creating post. Please check console for details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h1 className="text-4xl font-bold text-black mb-8">
            Create New Post
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#10b981] focus:border-transparent"
                placeholder="Enter post title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Content
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                rows={5}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#10b981] focus:border-transparent"
                placeholder="Write your post content here..."
              />
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-[#10b981] text-white rounded-lg font-medium hover:bg-[#059669] transition-colors disabled:opacity-50"
              >
                {loading ? "Creating..." : "Create Post"}
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-3 bg-white text-gray-700 border border-gray-200 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </PageTransition>
  );
}

export default function CreatePostPage() {
  return (
    <ProtectedRoute>
      <CreatePostContent />
    </ProtectedRoute>
  );
}
