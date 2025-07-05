# Railway CLI Setup Guide

## Installation & Usage

### 1. Install Railway CLI
```bash
npm install -g @railway/cli
```

### 2. Login to Railway
```bash
railway login
```
This opens your browser to authenticate with Railway.

### 3. Link to Your Project
After creating your project on Railway website:
```bash
railway link
```
Select your project from the list.

### 4. Run Database Setup Commands
```bash
# Push database schema
railway run npm run db:push

# Create super admin account
railway run node create-super-admin.js
```

### 5. Deploy Your Code
```bash
# Deploy current code
railway up
```

## Alternative: Automatic Setup

I've modified your app to automatically run setup when it starts in production on Railway. This means:

✅ **Database migrations** run automatically
✅ **Super admin account** creates automatically
✅ **No manual commands needed**

When you deploy to Railway with the environment variables, everything will be set up automatically!

## Commands Quick Reference

```bash
# Install CLI
npm install -g @railway/cli

# Login
railway login

# Link project
railway link

# Run any command on Railway
railway run [command]

# Deploy
railway up

# View logs
railway logs

# Open project dashboard
railway open
```

## Environment Variables Reminder

Make sure these are set in Railway before deployment:

- `NODE_ENV=production`
- `FIREBASE_PROJECT_ID=vet-dict-93f36`
- `FIREBASE_CLIENT_EMAIL=firebase-adminsdk-mlk3o@vet-dict-93f36.iam.gserviceaccount.com`
- `FIREBASE_PRIVATE_KEY="[your complete private key]"`
- `JWT_SECRET=VetDict2025SecureJWTKeyForProductionUse`

Railway will provide `DATABASE_URL` automatically when you add PostgreSQL.

## With Automatic Setup

Your app now handles setup automatically, so you just need to:

1. Set environment variables in Railway
2. Deploy your code
3. Railway will run setup automatically
4. Access your admin panel at `/admin`

No CLI commands needed!