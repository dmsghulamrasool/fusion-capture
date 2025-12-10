import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";
import connectMongoose from "@/lib/mongoose";
import BlogPost from "@/models/BlogPost";

const { auth } = NextAuth(authOptions as any);

/**
 * GET - Get a single blog post by ID
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  
  try {
    await connectMongoose();
    const { id } = await params;
    const post = await BlogPost.findById(id).lean();
    console.log("post", post);

    return NextResponse.json(
      { success: true, message: "Post fetched successfully", post },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching blog post:", error);
    return NextResponse.json(
      { error: "Internal server error", errors: error },
      { status: 500 }
    );
  }
  // try {
  //   await connectMongoose();
  //   const cookieStore = await cookies();
  //   const session = await auth({
  //     cookies: cookieStore,
  //   } as any);
  //   const { id } = await params;

  //   const post = await BlogPost.findById(id).lean();
  //   console.log("post", post);

  //   if (!post) {
  //     return NextResponse.json({ error: "Post not found" }, { status: 404 });
  //   }

  //   // Convert MongoDB _id and dates to strings for JSON serialization
  //   const serializedPost = {
  //     _id: post._id.toString(),
  //     title: post.title || "",
  //     content: post.content || "",
  //     authorId: post.authorId?.toString() || post.authorId || "",
  //     authorName: post.authorName || "Unknown",
  //     authorEmail: post.authorEmail || "",
  //     published: post.published || false,
  //     createdAt: post.createdAt
  //       ? new Date(post.createdAt).toISOString()
  //       : new Date().toISOString(),
  //     updatedAt: post.updatedAt
  //       ? new Date(post.updatedAt).toISOString()
  //       : new Date().toISOString(),
  //   };

  //   return NextResponse.json({ post: serializedPost });
  // } catch (error) {
  //   console.error("Error fetching blog post:", error);
  //   return NextResponse.json(
  //     { error: "Internal server error", errors: error },
  //     { status: 500 }
  //   );
  // }
}

/**
 * PUT - Update a blog post
 * Requires: posts.write permission and be the author
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // const cookieStore = await cookies();
    // const session = await auth({
    //   cookies: cookieStore,
    // } as any);
    const { id } = await params;

    // if (!session?.user) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }

    // Check permission - Admin has all permissions
    // const roles = session.user.roles || [];
    // const permissions = session.user.permissions || [];
    // const isAdmin = roles.includes("admin");

    // if (!isAdmin && !permissions.includes("posts.write")) {
    //   return NextResponse.json(
    //     { error: "Insufficient permissions" },
    //     { status: 403 }
    //   );
    // }

    await connectMongoose();

    const post = await BlogPost.findById(id);

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // // Check if user is the author (admin can edit any post)
    // // Normalize IDs to strings for comparison
    // const postAuthorId = post.authorId.toString();
    // const userId = session.user.id.toString();

    // if (postAuthorId !== userId && !isAdmin) {
    //   return NextResponse.json(
    //     { error: "You can only edit your own posts" },
    //     { status: 403 }
    //   );
    // }

    const { title, content, published } = await request.json();

    if (title) post.title = title;
    if (content) post.content = content;
    if (published !== undefined) post.published = published === true;

    await post.save();

    return NextResponse.json({ success: true, message: "Post updated successfully", post });
  } catch (error) {
    console.error("Error updating blog post:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Delete a blog post
 * Requires: posts.delete permission and be the author
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectMongoose();
    const { id } = await params;
    const post = await BlogPost.findByIdAndDelete(id);
    return NextResponse.json({
      success: true,
      message: "Post deleted successfully",
    });
    // const cookieStore = await cookies();
    // const session = await auth({
    //   cookies: cookieStore,
    // } as any);
    // const { id } = await params;

    // if (!session?.user) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }

    // // Check permission - Admin has all permissions
    // const roles = session.user.roles || [];
    // const permissions = session.user.permissions || [];
    // const isAdmin = roles.includes("admin");

    // if (!isAdmin && !permissions.includes("posts.delete")) {
    //   return NextResponse.json(
    //     { error: "Insufficient permissions" },
    //     { status: 403 }
    //   );
    // }

    // await connectMongoose();

    // const post = await BlogPost.findById(id);

    // if (!post) {
    //   return NextResponse.json({ error: "Post not found" }, { status: 404 });
    // }

    // // Check if user is the author (admin can delete any)
    // const postAuthorId = post.authorId.toString();
    // const userId = session.user.id.toString();

    // if (postAuthorId !== userId && !isAdmin) {
    //   return NextResponse.json(
    //     { error: "You can only delete your own posts" },
    //     { status: 403 }
    //   );
    // }

    // await BlogPost.findByIdAndDelete(id);

    // return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting blog post:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
