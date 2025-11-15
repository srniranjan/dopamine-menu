import type { VercelRequest, VercelResponse } from '@vercel/node';
import serverless from 'serverless-http';
import { createApp, setupApp } from '../server/index.js';

let handler: ReturnType<typeof serverless> | null = null;

export default async function vercelHandler(
  req: VercelRequest,
  res: VercelResponse,
) {
  // Initialize handler on first request (lazy initialization for cold starts)
  if (!handler) {
    const app = await createApp();
    await setupApp(app);
    handler = serverless(app);
  }

  // Use serverless-http to handle the request
  return handler(req, res);
}

