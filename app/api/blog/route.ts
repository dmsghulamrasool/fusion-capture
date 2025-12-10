import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";
import connectMongoose from "@/lib/mongoose";
import BlogPost from "@/models/BlogPost";
import { hasPagePermission } from "@/lib/rbac";

const { auth } = NextAuth(authOptions as any);

/**
 * GET - Get all blog posts
 * Public posts are visible to all, draft posts only to author
 */
export async function GET(request: Request) {
  try {
    await connectMongoose();

    // Simple: Get all posts without any filtering
    const posts = await BlogPost.find({}).sort({ createdAt: -1 }).lean();

    // Convert MongoDB _id and dates to strings for JSON serialization
    const serializedPosts = posts.map((post: any) => ({
      _id: post._id.toString(),
      title: post.title,
      content: post.content,
      authorId: post.authorId?.toString() || post.authorId,
      authorName: post.authorName,
      authorEmail: post.authorEmail,
      published: post.published,
      createdAt: post.createdAt
        ? new Date(post.createdAt).toISOString()
        : new Date().toISOString(),
      updatedAt: post.updatedAt
        ? new Date(post.updatedAt).toISOString()
        : new Date().toISOString(),
    }));

    return NextResponse.json({ posts: serializedPosts });
  } catch (error) {
    console.error("Error fetching blog posts:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST - Create a new blog post
 * Requires: canAdd permission for /blog/create page
 */

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check role access permission - Blog module requires canAdd
    const userId = session.user.id;
    const hasAddPermission = await hasPagePermission(
      userId,
      "/blog/create",
      "canAdd"
    );

    if (!hasAddPermission) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const { title, content, published = false } = await request.json();

    if (!title || !content) {
      return NextResponse.json(
        { error: "Title and content are required" },
        { status: 400 }
      );
    }

    await connectMongoose();

    const post = await BlogPost.create({
      title,
      content,
      authorId: session.user.id,
      authorName: session.user.name || "Unknown",
      authorEmail: session.user.email || "",
      published: published === true,
    });

    return NextResponse.json({ post }, { status: 201 });
  } catch (error) {
    console.error("Error creating blog post:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
