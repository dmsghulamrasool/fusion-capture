'use client';

import { PageTransition } from '@/components/ui/Loading';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePagePermissions } from '@/hooks/usePagePermissions';
import { useRouter } from 'next/navigation';

interface BlogPost {
  _id: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  authorEmail: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

function BlogContent() {
  const { user, hasPermission } = useAuth();
  const router = useRouter();
  const { permissions: pagePermissions, loading: permissionsLoading } = usePagePermissions("/blog");
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  // Check page-level permission
  // Only redirect to unauthorized if user is authenticated but doesn't have permission
  // If user is not authenticated, just don't show content (home page is public)
  useEffect(() => {
    console.log(`[BlogPage] Permission check - loading: ${permissionsLoading}, canView: ${pagePermissions.canView}, user:`, user);
    if (!permissionsLoading && user && !pagePermissions.canView) {
      console.log(`[BlogPage] Redirecting to unauthorized - canView is false`);
      router.push("/unauthorized");
    }
  }, [permissionsLoading, pagePermissions.canView, router, user]);

  useEffect(() => {
    // Fetch posts immediately when component mounts
    fetchPosts();
  }, []);

  // Refetch posts when user logs in/out to show drafts if logged in
  useEffect(() => {
    if (!loading) {
      fetchPosts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const fetchPosts = async () => {
    try {
      const response = await fetch('/api/blog', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store', // Always fetch fresh data
      });
      
      if (!response.ok) {
        console.error('Failed to fetch posts:', response.status, response.statusText);
        setPosts([]);
        return;
      }
      
      const data = await response.json();
      console.log('Fetched posts:', data); // Debug log
      setPosts(data.posts || []);
    } catch (error) {
      console.error('Error fetching posts:', error);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) {
      return;
    }

    try {
      const response = await fetch(`/api/blog/${postId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchPosts();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to delete post');
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Error deleting post');
    }
  };

  // Check permissions - use page-level permissions from role access
  // Profile and Blog modules: View, Add (canAdd), Update (canEdit), Delete (canDelete)
  const isAuthenticated = !!user;
  const canView = isAuthenticated && pagePermissions.canView;
  const canAdd = isAuthenticated && pagePermissions.canAdd; // Use pagePermissions instead of POSTS_WRITE
  const canEdit = isAuthenticated && pagePermissions.canEdit;
  const canDelete = isAuthenticated && pagePermissions.canDelete;

  if (loading || permissionsLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-gray-600">Loading posts...</div>
      </div>
    );
  }

  // Don't render if user doesn't have view permission
  if (!pagePermissions.canView) {
    return null;
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold text-black mb-2">Blog</h1>
              <p className="text-gray-600">Read and manage blog posts</p>
            </div>
            <Link
              href="/blog/create"
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                canAdd
                  ? 'bg-[#10b981] text-white hover:bg-[#059669]'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed pointer-events-none'
              }`}
              onClick={(e) => {
                if (!canAdd) {
                  e.preventDefault();
                }
              }}
            >
              Create Post
            </Link>
          </div>

          {posts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 mb-4">No blog posts yet.</p>
              {canAdd && (
                <Link
                  href="/blog/create"
                  className="text-[#10b981] hover:underline"
                >
                  Create your first post
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post) => (
                <div
                  key={post._id}
                  className="border border-gray-200 rounded-lg p-6 hover:border-[#10b981] transition-colors"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-black mb-2">
                        {post.title}
                      </h3>
                      <p className="text-sm text-gray-500 mb-2">
                        By {post.authorName}
                      </p>
                      <span
                        className={`inline-block px-2 py-1 text-xs rounded ${
                          post.published
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {post.published ? 'Published' : 'Draft'}
                      </span>
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {post.content.substring(0, 150)}...
                  </p>
                  <div className="flex items-center justify-between">
                    <Link
                      href={`/blog/${post._id}`}
                      className="text-[#10b981] hover:underline text-sm font-medium"
                    >
                      Read More →
                    </Link>
                    <div className="flex gap-2">
                      {/* Edit Button - Use page-level canEdit permission */}
                      <Link
                        href={`/blog/${post._id}/edit`}
                        className={`text-sm ${
                          canEdit
                            ? 'text-gray-600 hover:text-[#10b981] cursor-pointer'
                            : 'text-gray-400 cursor-not-allowed pointer-events-none opacity-50'
                        }`}
                        onClick={(e) => {
                          if (!canEdit) {
                            e.preventDefault();
                          }
                        }}
                      >
                        Edit
                      </Link>
                      {/* Delete Button - Use page-level canDelete permission */}
                      <button
                        onClick={() => {
                          if (canDelete) {
                            handleDelete(post._id);
                          }
                        }}
                        disabled={!canDelete}
                        className={`text-sm ${
                          canDelete
                            ? 'text-red-600 hover:text-red-800 cursor-pointer'
                            : 'text-gray-400 cursor-not-allowed opacity-50'
                        }`}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}

export default function BlogPage() {
  return <BlogContent />;
}

