import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import connectMongoose from "@/lib/mongoose";
import UserRole from "@/models/UserRole";

/**
 * GET - Get all users with their roles
 * ADMIN ONLY - Only admins can view all users
 *
 * Returns: { users: Array<{ id: string, email: string, name: string, roles: string[] }> }
 */
// export async function GET(request: Request) {
//   try {
//     // Check if user is authenticated and is admin
//     const cookieStore = await cookies();
//     const session = await auth({
//       cookies: cookieStore,
//       headers: request.headers,
//     } as any);

//     if (!session?.user) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     // Check if user has admin permission
//     const permissions = session.user.permissions || [];
//     if (!permissions.includes("admin.dashboard")) {
//       return NextResponse.json(
//         { error: "Only admins can view all users" },
//         { status: 403 }
//       );
//     }

//     // Get all users - simple approach
//     const client = await clientPromise;
//     const db = client.db();
//     const users = await db.collection("users").find({}).toArray();

//     await connectMongoose();
//     const userRoles = await UserRole.find({}).lean();

//     // Simple mapping
//     const usersWithRoles = users.map((user) => {
//       const userId = user._id.toString();
//       const roleDoc = userRoles.find((ur) => ur.userId === userId);
//       return {
//         id: userId,
//         email: user.email || "N/A",
//         name: user.name || "N/A",
//         roles: roleDoc?.roles || ["viewer"],
//       };
//     });

//     return NextResponse.json({
//       success: true,
//       users: usersWithRoles,
//       total: usersWithRoles.length,
//     });
//   } catch (error: any) {
//     console.error("Error fetching users:", error);
//     console.error("Error stack:", error?.stack);
//     console.error("Error message:", error?.message);
//     return NextResponse.json(
//       {
//         error: "Internal server error",
//         message: error?.message || "Unknown error",
//         details:
//           process.env.NODE_ENV === "development" ? error?.stack : undefined,
//       },
//       { status: 500 }
//     );
//   }
// }
/**
 * GET - Get all users with their roles
 * OPEN - No authentication required
 */
export async function GET(request: Request) {
  try {
    // Get all users from NextAuth's users collection
    const client = await clientPromise;
    const db = client.db();
    const users = await db.collection("users").find({}).toArray();

    // Get user roles from UserRole collection
    await connectMongoose();
    const userRoles = await UserRole.find({}).lean();

    // Combine users with their roles
    const usersWithRoles = users.map((user) => {
      const userId = user._id.toString();
      const roleDoc = userRoles.find((ur) => ur.userId === userId);
      return {
        id: userId,
        email: user.email || "N/A",
        name: user.name || "N/A",
        roles: roleDoc?.roles || ["viewer"],
      };
    });

    return NextResponse.json({
      success: true,
      users: usersWithRoles,
      total: usersWithRoles.length,
    });
  } catch (error: any) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}
