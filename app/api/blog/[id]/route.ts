import { NextResponse } from "next/server";
import connectMongoose from "@/lib/mongoose";
import BlogPost from "@/models/BlogPost";

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
 * No authentication required
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await connectMongoose();

    const post = await BlogPost.findById(id);

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

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
 * No authentication required
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await connectMongoose();

    const post = await BlogPost.findByIdAndDelete(id);

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Post deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting blog post:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
