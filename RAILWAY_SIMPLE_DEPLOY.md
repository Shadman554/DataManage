# Simple Railway Deployment

## Quick Fix for Railway 404 Error

Based on your Railway logs, the build is successful but there's an issue with the app startup. Let's simplify the deployment:

### 1. Environment Variables in Railway

Set these in Railway → Project → Settings → Variables:

```
NODE_ENV=production
FIREBASE_PROJECT_ID=vet-dict-93f36
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-mlk3o@vet-dict-93f36.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCwiLwXXYHkTLeu\n/CLewO6JszRclnqk5kH7hFNjSyUPbfUDPETnWgHx/EOcRhluUUCfK6rJxJNp3/wu\nJwSyCEYTxTlDwf6CyA6jSKRyzqI7bAK5kUpmxssAwrNHiwl0WSmvIEj3nWyoyX5j\nU1XWpn93PKvvmrw9s195z7+GtOrj1StA5IS+gbsO/ZWO1geqTRnL/eNz87R9Rp1P\n6dYyMvAv+7mIrOwB193Je0ACI5AP7caLLZudGCq1aADmDDyjhVEnxcZMXkxxeTMQ\nhKkijcq2u5ID6tvpCOnokVBDEoziEUQHaNZiJws7MhlKcNriR0RxOatnu3jeLbij\nzHFd0LpBAgMBAAECggEACMn/+lZTmJkYto+zUT2QCr9HMrpjuAjGPXZeu/Vyboia\nD5uNLysIKIL3n0TOsJM/SUVwavv8XmOyT55t8YqvqX2S3qyehiadcvPziws+YMC9\niH1jM8d/NSYcbKoPkhE73e4Yr+pQrf0dK6cLIaUXuMkmosbkixpefScymQtyG95s\nhzjTLtE+3MiYa1dT6xYCfJCmgh/XZrIs+TNuTXfM1uVwR+4Mq1PSk8TKEXxdQu2m\ng5ftLGfv+BafNvrWgte25qtd4oUWDyBBfB5k/liytvXGpzXRWrFrPvGqCrS/a9PZ\nmJR2vyuwMeNybNdXbFH0z4TaLC+Tq2CrS4atXzS0oQKBgQDfoRCJI6t73N+EXDkc\nxX3s8X4EzhiXku/IIq+2NF0sVV1QRv6NH2ZDSEZYRVTJOyGhkVNQCphSSjkW1oOD\nGFc+DE4+stSqHimrnPBhaZN6WIJyZbllxTpoBhigoJ3Bl2yO897fPbnXqT25WbZ7\n8amvLbuLpnrLk/W/ahrD96W8kQKBgQDKFn0CY99iCfCzycNpFM/WHyZQQPNYRCiC\nZKLRUMRuWSuGOlRDX/pVqPxZeIjZ0JjWT+WXhfoBUCgxL1/PNqSYrBgDGimk0cfR\nGDRJjCS0w0c/N9izSZyr4+kMqD/OGbGIDna/M2DEO0vDPHz013WgrmiuGFducEEU\nrihuobi6sQKBgHVjdOyoPsI8RVCToJ9LxDh24/Hdxeb7CMeD/bylbCtzfBJB0il+\nTA4RiGuZqVIgqhzHznX7uc2ojKNCY7KTOmilyQT8lsneH32oWj6oTvQwNfmbEGEt\n0OT+HjtjVKxksmWv+lQxcLaWboI3Z6VUTABa/1HlSBxJRPz/06D/BI8hAoGAZYxP\nXPgatAUSswVb8F3I4mvcsM8yeNQnFv7C4jOXwWuFd3mwBfsgrBKyW7M58VnksyyK\nzk1Ah5Bj4fNQTavDogQ4PLbU3kGcCvICtEJ732mRT68ccVs4Ixfvb7DL/yDiGOBL\nw2Bp67FwLLckg1QRg6CgcXtB0/kMevvYzV7umMECgYBoiwYJbhoHA7G4B5FkTENJ\nk2rI/7x73sFTPhRgTYX8oc738btpUZKjv2/AQJfm4bGIdkHuPtNMSEJAuqCmDJCM\n0HlLwUoU2PjcCWct1Z7Sggf7OYK+xF8HsIsZEhTkGosDkhVueMjKwzrVwbonvufr\nT4Z0+WH2Qk+6qD+iSdkOA==\n-----END PRIVATE KEY-----"
JWT_SECRET=VetDict2025SecureJWTKeyChangeThis
```

### 2. Deploy Steps

1. **Push your code** to GitHub with the latest changes
2. **Wait for Railway to build** (this may take 3-5 minutes)
3. **Check deployment URL** - Railway will provide a URL like: `https://your-app-name.railway.app`
4. **Test the admin panel** at: `https://your-app-name.railway.app/admin`

### 3. Manual Setup (After App is Running)

Once your app is live on Railway, you'll need to run these commands via Railway CLI:

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and link to your project
railway login
railway link

# Run database setup
railway run npm run db:push

# Create super admin
railway run node create-super-admin.js
```

### 4. Expected URLs

- **App Homepage**: `https://your-app-name.railway.app`
- **Admin Panel**: `https://your-app-name.railway.app/admin`
- **Login**: username: `superadmin`, password: `SuperAdmin123!`

### 5. Common Issues

**If you still get 404:**
1. Check Railway deployment logs for errors
2. Verify environment variables are set correctly
3. Make sure DATABASE_URL is automatically provided by Railway's PostgreSQL service

**If database errors:**
1. Add PostgreSQL service in Railway dashboard
2. Run the database setup commands via Railway CLI

The key is to get the basic app running first, then add the database setup manually.