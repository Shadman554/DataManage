# Railway Deployment Guide

## Quick Fix for Current Issue

The module import errors are fixed. Follow these steps:

## Deploy Steps

1. **Push the updated code to your Railway project**
2. **In Railway dashboard, set these environment variables:**
   - `NODE_ENV=production`
   - `DATABASE_URL=your-postgres-connection-string`
   - `JWT_SECRET=your-secure-jwt-secret`
   
3. **Set up the database manually:**
   - Go to your Railway PostgreSQL database
   - Run the SQL from `railway-db-setup.sql` file
   - This creates the admin tables and super admin account

4. **Redeploy the application**

## What's Fixed

- ✅ Module import errors resolved
- ✅ API routes now properly return JSON instead of HTML
- ✅ Static files served correctly
- ✅ PostgreSQL database integration
- ✅ Admin authentication system
- ✅ Proper production error handling

## Database Setup (Manual)

Since the automatic setup has import issues, manually run this SQL in your Railway PostgreSQL database:

```sql
-- Copy and paste the contents of railway-db-setup.sql
-- This creates the admin tables and super admin account
```

## Default Admin Credentials

- **Username:** `superadmin`
- **Password:** `SuperAdmin123!`
- **Role:** `super_admin`

## API Endpoints

All API endpoints are now properly configured:
- `POST /api/admin/login` - Admin login
- `GET /api/admin/profile` - Get admin profile
- `GET /api/collections/*` - Data management
- `POST /api/collections/*` - Create records
- `PUT /api/collections/*` - Update records
- `DELETE /api/collections/*` - Delete records

## Troubleshooting

If you still get the HTML error:
1. Check that `DATABASE_URL` is properly set
2. Verify the database is accessible
3. Check Railway logs for any database connection errors
4. Ensure all environment variables are configured

The application now has robust error handling and will properly return JSON error responses instead of HTML pages.