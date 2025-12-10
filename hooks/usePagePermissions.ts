import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";

interface PagePermissions {
  canView: boolean;
  canAdd: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

export function usePagePermissions(page: string) {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<PagePermissions>({
    canView: false,
    canAdd: false,
    canEdit: false,
    canDelete: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPermissions = async () => {
      // Admin always has all permissions
      if (user?.roles?.includes("admin")) {
        setPermissions({
          canView: true,
          canAdd: true,
          canEdit: true,
          canDelete: true,
        });
        setLoading(false);
        return;
      }

      // If user is not authenticated, no permissions
      if (!user?.id) {
        setPermissions({
          canView: false,
          canAdd: false,
          canEdit: false,
          canDelete: false,
        });
        setLoading(false);
        return;
      }

      try {
        // Fetch role access data
        const response = await fetch("/api/role-access", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          cache: "no-store",
        });

        if (response.ok) {
          const data = await response.json();
          console.log(`[usePagePermissions] API Response for page ${page}:`, data);
          
          if (data.success && data.roleAccess) {
            // Get user's role (first role)
            const userRole = user.roles?.[0] || "viewer";
            console.log(`[usePagePermissions] User role: ${userRole}, Looking for page: ${page}`);
            console.log(`[usePagePermissions] Available roles in response:`, Object.keys(data.roleAccess));
            console.log(`[usePagePermissions] Available pages for ${userRole}:`, Object.keys(data.roleAccess[userRole] || {}));
            
            // Get permissions for this role and page
            let roleAccess = data.roleAccess[userRole]?.[page];
            console.log(`[usePagePermissions] Found roleAccess:`, roleAccess);
            
            // Special case: If accessing blog list (/blog) and user can view individual posts (/blog/[id]),
            // allow viewing the list as well (makes logical sense)
            if (page === "/blog" && !roleAccess?.canView) {
              const blogPostAccess = data.roleAccess[userRole]?.["/blog/[id]"];
              console.log(`[usePagePermissions] Checking fallback for /blog, blogPostAccess:`, blogPostAccess);
              if (blogPostAccess?.canView) {
                roleAccess = {
                  ...roleAccess,
                  canView: true,
                };
                console.log(`[usePagePermissions] Fallback: Allowing /blog access because user can view /blog/[id]`);
              }
            }
            
            console.log(`[usePagePermissions] Final roleAccess for Role: ${userRole}, Page: ${page}:`, roleAccess);
            
            if (roleAccess) {
              const finalPermissions = {
                canView: roleAccess.canView === true,
                canAdd: roleAccess.canAdd === true,
                canEdit: roleAccess.canEdit === true,
                canDelete: roleAccess.canDelete === true,
              };
              console.log(`[usePagePermissions] Setting permissions:`, finalPermissions);
              setPermissions(finalPermissions);
            } else {
              // Default to no permissions if not found
              console.warn(`[usePagePermissions] No permissions found for role: ${userRole}, page: ${page}`);
              setPermissions({
                canView: false,
                canAdd: false,
                canEdit: false,
                canDelete: false,
              });
            }
          } else {
            console.error(`[usePagePermissions] Invalid response format:`, data);
          }
        } else {
          const errorText = await response.text();
          console.error(`[usePagePermissions] Failed to fetch permissions: ${response.status} ${response.statusText}`, errorText);
        }
      } catch (error) {
        console.error("Error fetching page permissions:", error);
        // Default to no permissions on error
        setPermissions({
          canView: false,
          canAdd: false,
          canEdit: false,
          canDelete: false,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPermissions();
  }, [user?.id, user?.roles, page]);

  return { permissions, loading };
}

