# Fusion Capture

A comprehensive Next.js 16 application with SSO login (Google and GitHub) and role-based access control system.

## 🎯 Features

### Authentication
- ✅ SSO login with **Google** and **GitHub**
- ✅ Link multiple provider accounts to the same user
- ✅ Database session management with MongoDB
- ✅ Secure authentication flow with NextAuth.js

### Authorization
- ✅ **Role-Based Access Control (RBAC)** - Admin, Editor, Viewer roles
- ✅ **Permission-Based Access Control** - Granular permissions for fine-grained control
- ✅ **Protected Routes** - Middleware-based route protection
- ✅ **Dynamic UI Control** - Pages, menu items, buttons, and components adapt based on permissions
- ✅ **403 Unauthorized Page** - Proper error handling for insufficient permissions
- ✅ **Server-side Authorization** - Checks in middleware and server components

### UI Components
- ✅ Protected pages (Dashboard, Admin, Editor, Profile)
- ✅ Dynamic navigation menu that shows/hides based on permissions
- ✅ Permission-based buttons (enabled/disabled)
- ✅ Conditional component rendering
- ✅ Role-specific content display
- ✅ Loading states during authentication checks

## 📋 Prerequisites

- Node.js 18+ 
- MongoDB (local or Atlas)
- Google OAuth credentials
- GitHub OAuth credentials

## 🚀 Setup Instructions

### 1. Clone and Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Create a `.env.local` file in the root directory:

```env
# MongoDB Connection String
MONGODB_URI=mongodb://localhost:27017/nextjs-sso-auth
# Or use MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here-generate-with-openssl-rand-base64-32

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# GitHub OAuth
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
```

### 3. Generate NextAuth Secret

```bash
openssl rand -base64 32
```

### 4. Setup Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
6. Copy Client ID and Client Secret to `.env.local`

### 5. Setup GitHub OAuth

1. Go to GitHub Settings → Developer settings → OAuth Apps
2. Click "New OAuth App"
3. Set Authorization callback URL: `http://localhost:3000/api/auth/callback/github`
4. Copy Client ID and Client Secret to `.env.local`

### 6. Start MongoDB

**Local MongoDB:**
```bash
mongod
```

**Or use MongoDB Atlas** (cloud) and update `MONGODB_URI` in `.env.local`

### 7. Run the Application

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 👥 User Personas & Roles

### Roles and Permissions

| Role | Permissions | Access |
|------|------------|--------|
| **Admin** | All permissions | Full access to all pages and features |
| **Editor** | `posts.read`, `posts.write`, `posts.delete`, `users.read` | Can manage posts, view users |
| **Viewer** | `posts.read`, `users.read` | Read-only access |

### Permission Structure

```
admin.dashboard      - Access admin dashboard
admin.users          - Manage users
admin.settings       - System settings
posts.read           - View posts
posts.write          - Create/edit posts
posts.delete         - Delete posts
users.read           - View users
users.write          - Create/edit users
users.delete         - Delete users
editor.dashboard     - Access editor dashboard
viewer.dashboard     - Access viewer dashboard
```

## 🧪 Demo Guide

### Step 1: Sign In

1. Navigate to `/login` or click "Sign In" in the navbar
2. Choose either Google or GitHub to sign in
3. After first sign-in, you'll be assigned the default **Viewer** role

### Step 2: Assign Demo Roles

After signing in, assign roles using the API endpoint:

**Option A: Using curl**
```bash
# Assign Admin role
curl -X POST http://localhost:3000/api/setup-demo-users \
  -H "Content-Type: application/json" \
  -d '{"email": "your-email@example.com", "role": "admin"}'

# Assign Editor role
curl -X POST http://localhost:3000/api/setup-demo-users \
  -H "Content-Type: application/json" \
  -d '{"email": "your-email@example.com", "role": "editor"}'

# Assign Viewer role (default)
curl -X POST http://localhost:3000/api/setup-demo-users \
  -H "Content-Type: application/json" \
  -d '{"email": "your-email@example.com", "role": "viewer"}'
```

**Option B: Using browser console**
```javascript
fetch('/api/setup-demo-users', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'your-email@example.com', role: 'admin' })
})
```

### Step 3: Test Authorization Scenarios

#### Scenario 1: Viewer Role
1. Sign in and assign Viewer role
2. Navigate to `/dashboard` - ✅ Should work
3. Navigate to `/editor` - ❌ Should redirect to `/unauthorized`
4. Navigate to `/admin` - ❌ Should redirect to `/unauthorized`
5. Check navbar - Only "Dashboard" and "Profile" should be visible
6. Check buttons - Delete buttons should be disabled

#### Scenario 2: Editor Role
1. Assign Editor role
2. Navigate to `/dashboard` - ✅ Should work
3. Navigate to `/editor` - ✅ Should work
4. Navigate to `/admin` - ❌ Should redirect to `/unauthorized`
5. Check navbar - "Dashboard", "Editor", and "Profile" should be visible
6. Check buttons - Create/Edit buttons enabled, Delete buttons enabled

#### Scenario 3: Admin Role
1. Assign Admin role
2. Navigate to `/dashboard` - ✅ Should work
3. Navigate to `/editor` - ✅ Should work
4. Navigate to `/admin` - ✅ Should work
5. Check navbar - All menu items should be visible
6. Check buttons - All buttons should be enabled
7. Check components - All admin components should be visible

### Step 4: Test Account Linking

1. Sign in with Google using your email
2. Sign out
3. Sign in with GitHub using the **same email**
4. Both accounts should be linked to the same user
5. Check `/profile` - You should see your profile with roles/permissions

### Step 5: Test Direct URL Access

1. Sign in as Viewer
2. Try to access `/admin` directly via URL - Should redirect to `/unauthorized`
3. Try to access `/editor` directly via URL - Should redirect to `/unauthorized`
4. Sign in as Admin
5. Try to access `/admin` directly - Should work

## 🏗️ Architecture Overview

### File Structure

```
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts    # NextAuth API route
│   │   └── setup-demo-users/route.ts      # Demo user setup API
│   ├── (auth)/
│   │   ├── login/page.tsx                 # Login page
│   │   └── unauthorized/page.tsx          # 403 page
│   ├── (protected)/
│   │   ├── dashboard/page.tsx             # Protected dashboard
│   │   ├── admin/page.tsx                 # Admin-only page
│   │   ├── editor/page.tsx                # Editor+ page
│   │   └── profile/page.tsx               # User profile
│   ├── layout.tsx                         # Root layout with providers
│   └── page.tsx                           # Home page
├── components/
│   ├── auth/
│   │   ├── ProtectedRoute.tsx             # Route protection wrapper
│   │   ├── RequirePermission.tsx          # Permission-based rendering
│   │   └── RequireRole.tsx                # Role-based rendering
│   ├── navigation/
│   │   └── Navbar.tsx                     # Dynamic navigation menu
│   ├── providers/
│   │   └── SessionProviderWrapper.tsx     # NextAuth provider wrapper
│   └── ui/
│       └── PermissionButton.tsx           # Permission-based button
├── contexts/
│   └── AuthContext.tsx                    # Auth context with hooks
├── lib/
│   ├── auth.ts                            # NextAuth configuration
│   ├── mongodb.ts                         # MongoDB connection
│   ├── permissions.ts                     # Permission constants
│   └── rbac.ts                            # RBAC utilities
├── middleware.ts                          # Route protection middleware
└── types/
    └── next-auth.d.ts                     # TypeScript type definitions
```

### Authorization Flow

1. **Authentication**: User signs in via Google/GitHub → NextAuth creates session
2. **Role Assignment**: On first sign-in, default "viewer" role is assigned
3. **Permission Calculation**: Permissions are calculated from user's roles
4. **Session Enhancement**: Roles and permissions added to session
5. **Route Protection**: Middleware checks permissions before allowing access
6. **UI Rendering**: Components check permissions to show/hide elements

### Key Components

#### Middleware (`middleware.ts`)
- Protects routes at the edge
- Checks authentication and permissions
- Redirects unauthorized users

#### Auth Context (`contexts/AuthContext.tsx`)
- Provides auth state to all components
- Exposes `hasRole()`, `hasPermission()` hooks
- Handles loading states

#### Protected Components
- `<ProtectedRoute>` - Wraps pages requiring auth/permissions
- `<RequirePermission>` - Conditionally renders based on permissions
- `<RequireRole>` - Conditionally renders based on roles
- `<PermissionButton>` - Button that enables/disables based on permissions

#### RBAC System (`lib/rbac.ts`)
- Role-to-permission mapping
- Permission calculation from roles
- User role management

## 🔒 Security Features

- ✅ Secure session management with database sessions
- ✅ CSRF protection via NextAuth
- ✅ Route protection at middleware level
- ✅ Server-side permission checks
- ✅ Account linking with email verification
- ✅ Type-safe authorization with TypeScript

## 📝 Code Structure Explanation

### How Authorization is Implemented

1. **Database Schema**:
   - `users` - User accounts (managed by NextAuth)
   - `accounts` - OAuth provider accounts (managed by NextAuth)
   - `sessions` - Active sessions (managed by NextAuth)
   - `userRoles` - Custom collection for user roles

2. **Permission System**:
   - Permissions are defined in `lib/permissions.ts`
   - Roles map to permissions in `lib/rbac.ts`
   - Permissions are calculated from roles and stored in session

3. **Route Protection**:
   - Middleware checks authentication and permissions
   - Server components can check permissions server-side
   - Client components use hooks for permission checks

4. **UI Control**:
   - Navigation menu filters items based on permissions
   - Buttons enable/disable based on permissions
   - Components conditionally render based on permissions
   - Pages redirect if user lacks required permissions

## 🐛 Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB is running: `mongod`
- Check `MONGODB_URI` in `.env.local`
- For Atlas, ensure IP is whitelisted

### OAuth Issues
- Verify redirect URIs match exactly
- Check client IDs and secrets in `.env.local`
- Ensure OAuth apps are properly configured

### Permission Issues
- Check user roles in MongoDB: `db.userRoles.find()`
- Verify permissions are calculated correctly
- Check browser console for errors

## 📚 Technologies Used

- **Next.js 16** - React framework with App Router
- **NextAuth.js** - Authentication library
- **MongoDB** - Database for users, sessions, and roles
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **React 19** - UI library

## 🎓 Learning Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [NextAuth.js Documentation](https://next-auth.js.org/)
- [MongoDB Documentation](https://docs.mongodb.com/)

## 📄 License

This project is for demonstration purposes.

## 👤 Author

Built as a senior Next.js developer assessment.

---

**Note**: This is a demo application. For production use, consider additional security measures like rate limiting, audit logging, and enhanced error handling.
