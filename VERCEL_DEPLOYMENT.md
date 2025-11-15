# Vercel Deployment Guide

This document outlines the steps and requirements for deploying this application to Vercel.

## Required Environment Variables

The following environment variables must be configured in your Vercel project settings:

### Database
- **`DATABASE_URL`** (Required)
  - PostgreSQL connection string for Neon database
  - Format: `postgresql://user:password@host:port/database?sslmode=require`
  - Example: `postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/dbname?sslmode=require`

### Stack Authentication
- **`STACK_PROJECT_ID`** (Required)
  - Your Stack authentication project ID
  - Found in your Stack dashboard under project settings

- **`STACK_API_KEY`** (Required)
  - Your Stack authentication API key
  - Found in your Stack dashboard under project settings

### Environment
- **`NODE_ENV`** (Optional, defaults to production)
  - Set to `production` for Vercel deployments
  - Vercel automatically sets this, but you can override if needed

## Setting Environment Variables in Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add each variable listed above
4. Select the appropriate environments (Production, Preview, Development)
5. Click **Save**

## Post-Deployment Configuration

### Stack Authentication Callback URLs

After deployment, update your Stack authentication callback URLs:

1. Go to your Stack dashboard
2. Navigate to your project settings
3. Update the callback URLs to point to your Vercel domain:
   - Sign-in callback: `https://your-project.vercel.app/handler/sign-in`
   - Sign-up callback: `https://your-project.vercel.app/handler/sign-up`
   - Sign-out redirect: `https://your-project.vercel.app/handler/sign-in`

### Database Connection

Ensure your Neon database:
- Allows connections from Vercel's IP ranges (Neon typically allows all by default)
- Has SSL enabled (required for serverless connections)
- Connection string includes `?sslmode=require` parameter

## Build Configuration

The project uses the following build configuration:

- **Build Command**: `npm run build`
- **Output Directory**: `dist/public`
- **Install Command**: `npm install`
- **Node Version**: 20.x (default)

Vercel will automatically:
- Build the frontend using Vite
- Bundle the server code using esbuild
- Deploy the serverless function from `api/index.ts`
- Serve static files from `dist/public`

## Project Structure

```
├── api/
│   └── index.ts          # Vercel serverless function wrapper
├── client/               # React frontend
├── server/               # Express backend
├── shared/               # Shared schema/types
├── vercel.json           # Vercel configuration
└── package.json          # Dependencies and scripts
```

## Troubleshooting

### Build Failures
- Ensure all environment variables are set in Vercel
- Check that `DATABASE_URL` is correctly formatted
- Verify Node.js version compatibility (20.x recommended)

### Runtime Errors
- Check Vercel function logs in the dashboard
- Verify database connectivity from serverless functions
- Ensure Stack authentication credentials are correct

### Static Files Not Loading
- Verify `dist/public` directory exists after build
- Check that `vercel.json` rewrites are configured correctly
- Ensure frontend build completes successfully

## Local Development

For local development, create a `.env` file in the root directory with:

```env
DATABASE_URL=your_database_url
STACK_PROJECT_ID=your_project_id
STACK_API_KEY=your_api_key
NODE_ENV=development
```

Then run:
```bash
npm install
npm run dev
```

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Neon Database Documentation](https://neon.tech/docs)
- [Stack Authentication Documentation](https://docs.stack-auth.com)

