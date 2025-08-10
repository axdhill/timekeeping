# Railway Deployment Guide

This application is configured for one-click deployment to Railway using GitHub integration.

## Quick Setup Steps

1. **Connect GitHub to Railway**:
   - Go to [Railway](https://railway.app)
   - Click "Start a New Project"
   - Choose "Deploy from GitHub repo"
   - Select the `timekeeping` repository
   - Railway will automatically detect the configuration

2. **Add PostgreSQL Database**:
   - In your Railway project dashboard
   - Click "New Service"
   - Select "Database" → "Add PostgreSQL"
   - Railway will automatically set the `DATABASE_URL` environment variable

3. **Set Required Environment Variables**:
   In the Railway dashboard, go to your service's Variables tab and add:
   
   ```
   JWT_SECRET=<generate-a-secure-random-string>
   NODE_ENV=production
   ```
   
   To generate a secure JWT secret, you can use:
   ```bash
   openssl rand -base64 32
   ```

4. **Deploy**:
   - Railway will automatically deploy when you push to GitHub
   - The first deployment will run database migrations automatically
   - Your app will be available at the Railway-provided URL

## Post-Deployment Steps

1. **Seed Initial Data** (Optional):
   - Open the Railway shell for your service
   - Run: `npm run seed`
   - This creates test users and projects

2. **Create Admin User**:
   If you don't want to use seed data, create an admin user:
   - Open Railway shell
   - Run: `npx prisma studio`
   - Create a new User with role "ADMIN"
   - Password should be hashed using bcrypt

## Environment Variables Reference

Railway automatically provides:
- `PORT` - The port your app should listen on
- `DATABASE_URL` - PostgreSQL connection string (when you add PostgreSQL)

You need to add:
- `JWT_SECRET` - Secret key for JWT token signing
- `NODE_ENV` - Set to "production"

Optional:
- `FRONTEND_URL` - If deploying frontend separately (not needed for this setup)

## Features Included

✅ Full-stack deployment (frontend + backend)
✅ Automatic HTTPS
✅ PostgreSQL database
✅ Automatic deployments from GitHub
✅ Database migrations run automatically
✅ Static file serving for React app
✅ API and frontend on same domain

## Troubleshooting

### Database Connection Issues
- Ensure PostgreSQL service is added to your Railway project
- Check that DATABASE_URL is set in environment variables
- Verify migrations have run (check deploy logs)

### Build Failures
- Check build logs in Railway dashboard
- Ensure all dependencies are in package.json
- Verify Node version compatibility (18.x required)

### Authentication Issues
- Verify JWT_SECRET is set
- Check cookies are enabled in browser
- Ensure HTTPS is working (Railway provides this automatically)

## Architecture on Railway

```
Railway Project
├── Web Service (Node.js/Express + React)
│   ├── Serves API on /api/*
│   ├── Serves React app on /*
│   └── Runs on PORT provided by Railway
└── PostgreSQL Database
    └── Connected via DATABASE_URL
```

## Monitoring

- View logs in Railway dashboard
- Check metrics for CPU, memory, and network usage
- Set up alerts for service health

## Updating

Simply push to your GitHub repository:
```bash
git add .
git commit -m "Your changes"
git push origin main
```

Railway will automatically:
1. Pull the latest code
2. Install dependencies
3. Build the React app
4. Run database migrations
5. Start the server

## Custom Domain (Optional)

1. In Railway dashboard, go to Settings → Domains
2. Add your custom domain
3. Update your DNS records as instructed
4. Railway handles SSL certificates automatically