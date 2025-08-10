# Deployment Guide

## Important Note About GitHub Pages

GitHub Pages can only host static websites (HTML, CSS, JavaScript). Since this timekeeping application requires a backend server (Node.js/Express) and a PostgreSQL database, **the GitHub Pages deployment will only show the frontend interface but won't be functional without the backend**.

## Full Application Deployment Options

To deploy the complete functional application, you need:

### Option 1: Deploy Backend and Frontend Separately
1. **Backend (API + Database)**:
   - Deploy to services like Heroku, Railway, Render, or AWS
   - Set up PostgreSQL database (many services offer this)
   - Configure environment variables (.env)
   - Update CORS settings to allow frontend domain

2. **Frontend**:
   - Can remain on GitHub Pages
   - Update API endpoints to point to your deployed backend URL
   - Configure proxy or base URL in the React app

### Option 2: Full-Stack Deployment Services
Use services that support both frontend and backend:
- **Vercel** (Frontend) + **Supabase** (Database + Backend)
- **Railway** (Full stack)
- **Render** (Full stack)
- **Heroku** (Full stack)
- **DigitalOcean App Platform**

### Option 3: Self-Hosted
Deploy on your own VPS or cloud instance:
- Set up Node.js, PostgreSQL
- Use PM2 for process management
- Configure Nginx as reverse proxy
- Set up SSL certificates with Let's Encrypt

## Local Development Setup

For local testing with full functionality:

```bash
# Install dependencies
npm install
cd client && npm install

# Set up database
npm run prisma:migrate
npm run seed

# Run both frontend and backend
npm run dev
```

## Environment Variables Required

Create a `.env` file in the root directory:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/timekeeping?schema=public"
JWT_SECRET="your-secret-key-here"
PORT=5001
NODE_ENV=development
```

## GitHub Pages Deployment (Frontend Only)

The GitHub Actions workflow automatically deploys the frontend to GitHub Pages when you push to the main branch. This creates a static demonstration of the UI but requires backend deployment for full functionality.

To manually deploy to GitHub Pages:

```bash
cd client
npm run deploy
```

## Production Considerations

1. **Security**:
   - Use HTTPS everywhere
   - Secure JWT secret
   - Enable CORS only for your frontend domain
   - Use environment variables for sensitive data

2. **Database**:
   - Set up regular backups
   - Use connection pooling
   - Add indexes for performance

3. **Monitoring**:
   - Set up error tracking (e.g., Sentry)
   - Monitor API performance
   - Set up alerts for downtime

4. **Scaling**:
   - Consider using a CDN for static assets
   - Implement caching strategies
   - Use load balancing for high traffic