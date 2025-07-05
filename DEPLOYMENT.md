# Railway Deployment Guide

## Step-by-Step Deployment Instructions

### Prerequisites
- Railway account (sign up at railway.app)
- Your project code ready
- Firebase credentials
- PostgreSQL database access

### Step 1: Prepare Your Repository
1. **Push your code to GitHub/GitLab:**
   ```bash
   git add .
   git commit -m "Prepare for Railway deployment"
   git push origin main
   ```

### Step 2: Create Railway Project
1. Go to [railway.app](https://railway.app)
2. Click "Start a New Project"
3. Select "Deploy from GitHub repo"
4. Choose your repository
5. Railway will automatically detect it's a Node.js project

### Step 3: Add PostgreSQL Database
1. In your Railway project dashboard
2. Click "New" → "Database" → "PostgreSQL"
3. Railway will automatically create a PostgreSQL database
4. Note the DATABASE_URL (Railway will auto-inject this)

### Step 4: Configure Environment Variables
In Railway project settings → Variables, add these:

**Required Variables:**
```
NODE_ENV=production
FIREBASE_PROJECT_ID=vet-dict-93f36
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-mlk3o@vet-dict-93f36.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
MIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCwiLwXXYHkTLeu
/CLewO6JszRclnqk5kH7hFNjSyUPbfUDPETnWgHx/EOcRhluUUCfK6rJxJNp3/wu
JwSyCEYTxTlDwf6CyA6jSKRyzqI7bAK5kUpmxssAwrNHiwl0WSmvIEj3nWyoyX5j
U1XWpn93PKvvmrw9s195z7+GtOrj1StA5IS+gbsO/ZWO1geqTRnL/eNz87R9Rp1P
6dYyMvAv+7mIrOwB193Je0ACI5AP7caLLZudGCq1aADmDDyjhVEnxcZMXkxxeTMQ
hKkijcq2u5ID6tvpCOnokVBDEoziEUQHaNZiJws7MhlKcNriR0RxOatnu3jeLbij
zHFd0LpBAgMBAAECggEACMn/+lZTmJkYto+zUT2QCr9HMrpjuAjGPXZeu/Vyboia
D5uNLysIKIL3n0TOsJM/SUVwavv8XmOyT55t8YqvqX2S3qyehiadcvPziws+YMC9
iH1jM8d/NSYcbKoPkhE73e4Yr+pQrf0dK6cLIaUXuMkmosbkixpefScymQtyG95s
hzjTLtE+3MiYa1dT6xYCfJCmgh/XZrIs+TNuTXfM1uVwR+4Mq1PSk8TKEXxdQu2m
g5ftLGfv+BafNvrWgte25qtd4oUWDyBBfB5k/liytvXGpzXRWrFrPvGqCrS/a9PZ
mJR2vyuwMeNybNdXbFH0z4TaLC+Tq2CrS4atXzS0oQKBgQDfoRCJI6t73N+EXDkc
xX3s8X4EzhiXku/IIq+2NF0sVV1QRv6NH2ZDSEZYRVTJOyGhkVNQCphSSjkW1oOD
GFc+DE4+stSqHimrnPBhaZN6WIJyZbllxTpoBhigoJ3Bl2yO897fPbnXqT25WbZ7
8amvLbuLpnrLk/W/ahrD96W8kQKBgQDKFn0CY99iCfCzycNpFM/WHyZQQPNYRCiC
ZKLRUMRuWSuGOlRDX/pVqPxZeIjZ0JjWT+WXhfoBUCgxL1/PNqSYrBgDGimk0cfR
GDRJjCS0w0c/N9izSZyr4+kMqD/OGbGIDna/M2DEO0vDPHz013WgrmiuGFducEEU
rihuobi6sQKBgHVjdOyoPsI8RVCToJ9LxDh24/Hdxeb7CMeD/bylbCtzfBJB0il+
TA4RiGuZqVIgqhzHznX7uc2ojKNCY7KTOmilyQT8lsneH32oWj6oTvQwNfmbEGEt
0OT+HjtjVKxksmWv+lQxcLaWboI3Z6VUTABa/1HlSBxJRPz/06D/BI8hAoGAZYxP
XPgatAUSswVb8F3I4mvcsM8yeNQnFv7C4jOXwWuFd3mwBfsgrBKyW7M58VnksyyK
zk1Ah5Bj4fNQTavDogQ4PLbU3kGcCvICtEJ732mRT68ccVs4Ixfvb7DL/yDiGOBL
w2Bp67FwLLckg1QRg6CgcXtB0/kMevvYzV7umMECgYBoiwYJbhoHA7G4B5FkTENJ
k2rI/7x73sFTPhRgTYX8oc738btpUZKjv2/AQJfm4bGIdkHuPtNMSEJAuqCmDJCM
0HlLwUoU2PjcCWct1Z7Sggf7OYK+xF8HsIsZEhTkGosDkhVueMjKwzrVwbonvufr
tT4Z0+WH2Qk+6qD+iSdkOA==
-----END PRIVATE KEY-----"
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-make-it-long-and-random
```

**Important Notes:**
- Copy the FIREBASE_PRIVATE_KEY exactly as shown (with \n for newlines)
- Make sure to set a strong JWT_SECRET
- DATABASE_URL will be automatically provided by Railway

### Step 5: Run Database Migrations
After deployment, run this command in Railway's console:
```bash
npm run db:push
```

### Step 6: Create Super Admin Account
Run this command in Railway's console:
```bash
node create-super-admin.js
```

### Step 7: Deploy
1. Railway will automatically deploy when you push to your main branch
2. Check the build logs in Railway dashboard
3. Once deployed, Railway will provide you with a public URL

### Step 8: Access Your Admin Panel
1. Visit your Railway-provided URL
2. Go to `/admin` route
3. Login with: username: `superadmin`, password: `SuperAdmin123!`

## Troubleshooting

### Common Issues:

**Build Fails:**
- Check that all environment variables are set correctly
- Ensure Node.js version compatibility (set to 18.x in nixpacks.toml)

**Database Connection Issues:**
- Verify DATABASE_URL is automatically injected by Railway
- Run database migrations after first deployment

**Firebase Authentication Errors:**
- Double-check FIREBASE_PRIVATE_KEY formatting
- Ensure Firebase service account has proper permissions

**Admin Login Not Working:**
- Make sure you ran the super admin creation script
- Check PostgreSQL database is connected

## Production Security Checklist
- [ ] Change default JWT_SECRET
- [ ] Update super admin password after first login
- [ ] Verify Firebase security rules
- [ ] Enable Railway's built-in SSL
- [ ] Configure custom domain (optional)

## Post-Deployment
- Your app will be accessible at: `https://your-app-name.railway.app`
- Admin panel: `https://your-app-name.railway.app/admin`
- All data saves to your Firebase database
- Admin authentication uses PostgreSQL
- Activity logging tracks all admin actions

## Support
If you encounter issues:
1. Check Railway deployment logs
2. Verify all environment variables are set
3. Ensure database migrations completed
4. Test Firebase connection in Railway console