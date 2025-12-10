"use client";

import { PageTransition } from "@/components/ui/Loading";
import { useAuth } from "@/contexts/AuthContext";
import { PERMISSIONS } from "@/lib/permissions";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { usePagePermissions } from "@/hooks/usePagePermissions";

interface BlogPost {
  _id: string;
  title: string;
  content: string;
  authorName: string;
  authorEmail: string;
  authorId: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

function BlogPostContent() {
  const params = useParams();
  const router = useRouter();
  const { user, hasPermission, loading: authLoading } = useAuth();
  const { permissions: pagePermissions, loading: permissionsLoading } =
    usePagePermissions("/blog/[id]");
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);

  // Check page-level permission
  // Only redirect to unauthorized if user is authenticated but doesn't have permission
  // If user is not authenticated, just don't show content (blog view is public)
  useEffect(() => {
    if (!permissionsLoading && user && !pagePermissions.canView) {
      router.push("/unauthorized");
    }
  }, [permissionsLoading, pagePermissions.canView, router, user]);

  useEffect(() => {
    if (params.id) {
      fetchPost();
    }
  }, [params.id]);

  const fetchPost = async () => {
    try {
      const response = await fetch(`/api/blog/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setPost(data.post);
      } else {
        router.push("/blog");
      }
    } catch (error) {
      console.error("Error fetching post:", error);
      router.push("/blog");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this post?")) {
      return;
    }

    try {
      const response = await fetch(`/api/blog/${params.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        router.push("/blog");
      } else {
        alert("Failed to delete post");
      }
    } catch (error) {
      console.error("Error deleting post:", error);
      alert("Error deleting post");
    }
  };

  if (loading || permissionsLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!post) {
    return null;
  }

  // Don't render if user doesn't have view permission
  if (!pagePermissions.canView) {
    return null;
  }

  const isAuthenticated = !!user;

  // Use page-level permissions - only check permissions, not roles or authorship
  const canEdit = isAuthenticated && pagePermissions.canEdit;
  const canDelete = isAuthenticated && pagePermissions.canDelete;
  return (
    <PageTransition>
      <div className="min-h-screen bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="mb-8">
            <Link
              href="/blog"
              className="text-[#10b981] hover:underline mb-4 inline-block"
            >
              ← Back to Blog
            </Link>
          </div>

          <article>
            <div className="flex justify-between items-start mb-6">
              <div>
                <h1 className="text-4xl font-bold text-black mb-4">
                  {post.title}
                </h1>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span>By {post.authorName}</span>
                  <span>•</span>
                  <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                  <span
                    className={`px-2 py-1 rounded ${
                      post.published
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {post.published ? "Published" : "Draft"}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                {/* Edit Button - Always visible but disabled if not authorized */}
                <Link
                  href={`/blog/${post._id}/edit`}
                  className={`px-4 py-2 border rounded-lg transition-colors text-sm ${
                    canEdit
                      ? "bg-white text-gray-700 border-gray-200 hover:bg-gray-50 cursor-pointer"
                      : "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed pointer-events-none opacity-50"
                  }`}
                  onClick={(e) => {
                    if (!canEdit) {
                      e.preventDefault();
                    }
                  }}
                >
                  Edit
                </Link>
                {/* Delete Button - Always visible but disabled if not authorized */}
                <button
                  onClick={handleDelete}
                  disabled={!canDelete}
                  className={`px-4 py-2 border rounded-lg transition-colors text-sm ${
                    canDelete
                      ? "bg-red-50 text-red-700 border-red-200 hover:bg-red-100 cursor-pointer"
                      : "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed opacity-50"
                  }`}
                >
                  Delete
                </button>
              </div>
            </div>

            <div className="prose max-w-none">
              <div className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                {post.content}
              </div>
            </div>
          </article>
        </div>
      </div>
    </PageTransition>
  );
}

export default function BlogPostPage() {
  return <BlogPostContent />;
}
