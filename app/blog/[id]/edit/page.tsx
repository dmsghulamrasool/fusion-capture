'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { PageTransition } from '@/components/ui/Loading';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { usePagePermissions } from '@/hooks/usePagePermissions';
import { useAuth } from '@/contexts/AuthContext';

interface BlogPost {
  _id: string;
  title: string;
  content: string;
  published: boolean;
  authorId: string;
}

function EditPostContent() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { permissions: pagePermissions, loading: permissionsLoading } = usePagePermissions("/blog/[id]/edit");
  const [post, setPost] = useState<BlogPost | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [published, setPublished] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Check page-level permission
  // Only redirect to unauthorized if user is authenticated but doesn't have permission
  // If user is not authenticated, ProtectedRoute will handle redirect to login
  useEffect(() => {
    if (!permissionsLoading && user && !pagePermissions.canEdit) {
      router.push("/unauthorized");
    }
  }, [permissionsLoading, pagePermissions.canEdit, router, user]);

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
        setTitle(data.post.title);
        setContent(data.post.content);
        setPublished(data.post.published);
      } else {
        router.push('/blog');
      }
    } catch (error) {
      console.error('Error fetching post:', error);
      router.push('/blog');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch(`/api/blog/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content, published }),
      });

      if (response.ok) {
        router.push(`/blog/${params.id}`);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to update post');
      }
    } catch (error) {
      console.error('Error updating post:', error);
      alert('Error updating post');
    } finally {
      setSaving(false);
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

  // Don't render if user doesn't have edit permission
  if (!pagePermissions.canEdit) {
    return null;
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h1 className="text-4xl font-bold text-black mb-8">Edit Post</h1>

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
                rows={15}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#10b981] focus:border-transparent"
                placeholder="Write your post content here..."
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="published"
                checked={published}
                onChange={(e) => setPublished(e.target.checked)}
                className="w-4 h-4 text-[#10b981] border-gray-300 rounded focus:ring-[#10b981]"
              />
              <label htmlFor="published" className="ml-2 text-sm text-gray-700">
                Publish
              </label>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-3 bg-[#10b981] text-white rounded-lg font-medium hover:bg-[#059669] transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
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

export default function EditPostPage() {
  return (
    <ProtectedRoute>
      <EditPostContent />
    </ProtectedRoute>
  );
}

