import { NextResponse } from "next/server";
import connectMongoose from "@/lib/mongoose";
import RoleAccess from "@/models/RoleAccess";

// Define available pages in the application
export const AVAILABLE_PAGES = [
  { path: "/admin", name: "Admin Dashboard" },
  { path: "/editor", name: "Editor Dashboard" },
  { path: "/dashboard", name: "User Dashboard" },
  { path: "/blog", name: "Blog List" },
  { path: "/blog/create", name: "Create Blog" },
  { path: "/blog/[id]", name: "View Blog" },
  { path: "/blog/[id]/edit", name: "Edit Blog" },
  { path: "/profile", name: "User Profile" },
];

/**
 * GET endpoint to fetch all role access permissions
 * OPEN - No authentication required
 */
export async function GET(request: Request) {
  try {
    await connectMongoose();

    // Get all role access records
    const roleAccesses = await RoleAccess.find({}).lean();
    console.log(
      "[GET /api/role-access] Total records in DB:",
      roleAccesses.length
    );
    console.log(
      "[GET /api/role-access] Records from DB:",
      JSON.stringify(roleAccesses, null, 2)
    );

    // Build response with all roles and pages
    const roles = ["admin", "editor", "viewer"];
    const result: Record<string, Record<string, any>> = {};

    for (const role of roles) {
      result[role] = {};
      for (const page of AVAILABLE_PAGES) {
        const access = roleAccesses.find(
          (ra) => ra.role === role && ra.page === page.path
        );

        console.log(
          `[GET /api/role-access] Role: ${role}, Page: ${page.path}, Found in DB:`,
          access
        );

        // Admin has all permissions by default
        if (role === "admin") {
          result[role][page.path] = {
            page: page.path,
            pageName: page.name,
            canView: true,
            canAdd: true,
            canEdit: true,
            canDelete: true,
          };
        } else {
          // Profile page: Full permissions for everyone by default
          const isProfilePage = page.path === "/profile";

          // Default: canView is true for all pages, full permissions for profile
          const permissions = {
            page: page.path,
            pageName: page.name,
            canView: access?.canView ?? true, // Default to true
            canAdd: isProfilePage
              ? access?.canAdd ?? true // Profile: default true
              : access?.canAdd ?? false, // Other pages: default false
            canEdit: isProfilePage
              ? access?.canEdit ?? true // Profile: default true
              : access?.canEdit ?? false, // Other pages: default false
            canDelete: isProfilePage
              ? access?.canDelete ?? true // Profile: default true
              : access?.canDelete ?? false, // Other pages: default false
          };
          console.log(
            `[GET /api/role-access] Role: ${role}, Page: ${page.path}, Permissions:`,
            permissions
          );
          result[role][page.path] = permissions;
        }
      }
    }

    return NextResponse.json({
      success: true,
      roleAccess: result,
      pages: AVAILABLE_PAGES,
    });
  } catch (error) {
    console.error("Error fetching role access:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PUT endpoint to update role access permissions
 * OPEN - No authentication required
 */
export async function PUT(request: Request) {
  try {
    const { role, page, canView, canAdd, canEdit, canDelete } =
      await request.json();

    if (!role || !page) {
      return NextResponse.json(
        { error: "Role and page are required" },
        { status: 400 }
      );
    }

    // Prevent modifying admin role access (admin always has all permissions)
    if (role === "admin") {
      return NextResponse.json(
        {
          error:
            "Admin role cannot be modified. Admin has all permissions by default.",
        },
        { status: 400 }
      );
    }

    if (!["editor", "viewer"].includes(role)) {
      return NextResponse.json(
        { error: "Invalid role. Must be editor or viewer" },
        { status: 400 }
      );
    }

    // Validate page exists
    const pageExists = AVAILABLE_PAGES.some((p) => p.path === page);
    if (!pageExists) {
      return NextResponse.json({ error: "Invalid page path" }, { status: 400 });
    }

    await connectMongoose();

    // Ensure boolean values (handle string "true"/"false" from form submissions)
    const boolCanView = canView === true || canView === "true";
    const boolCanAdd = canAdd === true || canAdd === "true";
    const boolCanEdit = canEdit === true || canEdit === "true";
    const boolCanDelete = canDelete === true || canDelete === "true";

    console.log(
      `[PUT /api/role-access] Updating - Role: ${role}, Page: ${page}`
    );
    console.log(`[PUT /api/role-access] Raw values:`, {
      canView,
      canAdd,
      canEdit,
      canDelete,
    });
    console.log(`[PUT /api/role-access] Boolean values:`, {
      boolCanView,
      boolCanAdd,
      boolCanEdit,
      boolCanDelete,
    });

    // Update or create role access
    const roleAccess = await RoleAccess.findOneAndUpdate(
      { role, page },
      {
        $set: {
          canView: boolCanView,
          canAdd: boolCanAdd,
          canEdit: boolCanEdit,
          canDelete: boolCanDelete,
          updatedAt: new Date(),
        },
      },
      { upsert: true, new: true }
    );

    console.log(`[PUT /api/role-access] Saved to DB:`, roleAccess);

    return NextResponse.json({
      success: true,
      message: "Role access updated successfully",
      roleAccess,
    });
  } catch (error) {
    console.error("Error updating role access:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
