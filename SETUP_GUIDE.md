# Quick Setup Guide

## Step-by-Step Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup Environment Variables

Create `.env.local` file:

```env
MONGODB_URI=mongodb://localhost:27017/nextjs-sso-auth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
```

### 3. Generate NextAuth Secret
```bash
openssl rand -base64 32
```

### 4. Setup OAuth Providers

#### Google OAuth:
1. Go to https://console.cloud.google.com/
2. Create project → Enable Google+ API
3. Create OAuth 2.0 Client ID
4. Add redirect URI: `http://localhost:3000/api/auth/callback/google`

#### GitHub OAuth:
1. Go to GitHub Settings → Developer settings → OAuth Apps
2. Create new OAuth App
3. Set callback URL: `http://localhost:3000/api/auth/callback/github`

### 5. Start MongoDB
```bash
mongod
```

### 6. Run Application
```bash
npm run dev
```

### 7. Assign Demo Roles

After signing in, assign roles:

```bash
# Using curl
curl -X POST http://localhost:3000/api/setup-demo-users \
  -H "Content-Type: application/json" \
  -d '{"email": "your-email@example.com", "role": "admin"}'
```

Or use browser console:
```javascript
fetch('/api/setup-demo-users', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'your-email@example.com', role: 'admin' })
})
```

## Testing Checklist

- [ ] Sign in with Google
- [ ] Sign in with GitHub  
- [ ] Link both accounts (same email)
- [ ] Assign Admin role → Access `/admin`
- [ ] Assign Editor role → Access `/editor`
- [ ] Assign Viewer role → Try accessing `/admin` → Should redirect to `/unauthorized`
- [ ] Check navbar shows/hides menu items based on permissions
- [ ] Check buttons enable/disable based on permissions
- [ ] Check components show/hide based on permissions

## Common Issues

**MongoDB Connection Error:**
- Ensure MongoDB is running: `mongod`
- Check `MONGODB_URI` in `.env.local`

**OAuth Error:**
- Verify redirect URIs match exactly
- Check client IDs/secrets are correct

**Permission Issues:**
- Check user roles in MongoDB: `db.userRoles.find()`
- Sign out and sign in again to refresh session

