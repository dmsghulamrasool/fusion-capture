import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import clientPromise from "@/lib/mongodb";
import connectMongoose from "@/lib/mongoose";
import UserRole from "@/models/UserRole";
import { ObjectId } from "mongodb";
import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasPagePermission } from "@/lib/rbac";

const { auth } = NextAuth(authOptions as any);

/**
 * API Route to setup demo users with different roles
 * ADMIN ONLY - Only admins can assign/change user roles
 *
 * Usage: POST /api/setup-demo-users
 * Body: { email?: string, userId?: string, role: 'admin' | 'editor' | 'viewer' }
 * Note: Either email or userId must be provided
 */
export async function POST(request: Request) {
  try {
    // Check if user is authenticated and is admin
    const cookieStore = await cookies();
    const session = await auth({
      cookies: cookieStore,
      headers: request.headers,
    } as any);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check role access permission - Admin module requires canView
    const userId = session.user.id;
    const hasViewPermission = await hasPagePermission(
      userId,
      "/admin",
      "canView"
    );

    if (!hasViewPermission) {
      return NextResponse.json(
        { error: "Insufficient permissions. Only admins can change user roles." },
        { status: 403 }
      );
    }

    const { email, userId, role } = await request.json();

    if (!role) {
      return NextResponse.json({ error: "Role is required" }, { status: 400 });
    }

    if (!email && !userId) {
      return NextResponse.json(
        { error: "Either email or userId is required" },
        { status: 400 }
      );
    }

    if (!["admin", "editor", "viewer"].includes(role)) {
      return NextResponse.json(
        { error: "Invalid role. Must be admin, editor, or viewer" },
        { status: 400 }
      );
    }

    // Use MongoDB native client for NextAuth collections
    const client = await clientPromise;
    const db = client.db();

    let finalUserId: string;

    if (userId) {
      // If userId is provided, use it directly
      finalUserId = userId.toString();

      // Try to find user with ObjectId or string format
      let user;
      try {
        // Try ObjectId format first
        user = await db.collection("users").findOne({
          _id: new ObjectId(userId),
        });
      } catch (e) {
        // If ObjectId fails, try string format
        user = await db.collection("users").findOne({
          _id: userId,
        });
      }

      // If still not found, try finding by userId in accounts collection
      if (!user) {
        const account = await db.collection("accounts").findOne({
          userId: new ObjectId(userId),
        });
        if (account) {
          finalUserId = account.userId.toString();
        } else {
          return NextResponse.json(
            { error: "User not found with provided userId" },
            { status: 404 }
          );
        }
      } else {
        finalUserId = user._id.toString();
      }
    } else if (email) {
      // Find user by email from accounts collection (NextAuth collection)
      const account = await db.collection("accounts").findOne({
        email: email,
      });

      if (!account) {
        return NextResponse.json(
          { error: "User not found. Please sign in first." },
          { status: 404 }
        );
      }

      // Get user ID from account
      finalUserId = account.userId.toString();
    } else {
      return NextResponse.json(
        { error: "Either email or userId must be provided" },
        { status: 400 }
      );
    }

    // Connect Mongoose and update/create user role using Mongoose model
    await connectMongoose();

    await UserRole.findOneAndUpdate(
      { userId: finalUserId },
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
      message: `Role '${role}' assigned successfully`,
      userId: finalUserId,
    });
  } catch (error) {
    console.error("Error setting up demo user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to list all users and their roles
 * ADMIN ONLY - Only admins can view all users
 */
export async function GET(request: Request) {
  try {
    // Check if user is authenticated and is admin
    const cookieStore = await cookies();
    const session = await auth({
      cookies: cookieStore,
      headers: request.headers,
    } as any);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check role access permission - Admin module requires canView
    const userId = session.user.id;
    const hasViewPermission = await hasPagePermission(
      userId,
      "/admin",
      "canView"
    );

    if (!hasViewPermission) {
      return NextResponse.json(
        { error: "Insufficient permissions. Only admins can view all users." },
        { status: 403 }
      );
    }

    // Use MongoDB native client for NextAuth collections
    const client = await clientPromise;
    const db = client.db();

    // Get all users from NextAuth users collection
    const users = await db.collection("users").find({}).toArray();
    console.log("Found users in database:", users.length); // Debug log

    // Use Mongoose for userRoles
    await connectMongoose();
    const userRoles = await UserRole.find({}).lean();
    console.log("Found user roles in database:", userRoles.length); // Debug log

    // Map users with their roles
    const usersWithRoles = users.map((user) => {
      const userObjectId = user._id.toString();
      const roleDoc = userRoles.find(
        (ur) => ur.userId === userObjectId
      );
      return {
        id: userObjectId,
        email: user.email || "N/A",
        name: user.name || "N/A",
        roles: roleDoc?.roles || ["viewer"],
      };
    });

    console.log("Returning users with roles:", usersWithRoles.length); // Debug log
    return NextResponse.json({ users: usersWithRoles });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
