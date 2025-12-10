import { NextResponse } from "next/server";
import connectMongoose from "@/lib/mongoose";
import UserRole from "@/models/UserRole";

/**
 * PUT - Update user role
 * OPEN - No authentication required
 * Body: { role: 'admin' | 'editor' | 'viewer' }
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { role } = await request.json();

    if (!role) {
      return NextResponse.json({ error: "Role is required" }, { status: 400 });
    }

    if (!["admin", "editor", "viewer"].includes(role)) {
      return NextResponse.json(
        { error: "Invalid role. Must be admin, editor, or viewer" },
        { status: 400 }
      );
    }

    // Update user role (permissions will be recalculated on next login)
    await connectMongoose();
    await UserRole.findOneAndUpdate(
      { userId: id },
      {
        $set: {
          roles: [role],
          updatedAt: new Date(),
        },
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({
      success: true,
      message: `Role '${role}' updated successfully`,
      userId: id,
    });
  } catch (error: any) {
    console.error("Error updating user role:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}

