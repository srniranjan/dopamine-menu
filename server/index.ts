import 'dotenv/config';
import express, { type Express, type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { stackServerApp } from './stack-server';
import { createServer, type Server } from "http";

export async function createApp(): Promise<Express> {
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  // Middleware to extract stackUserId from Stack authentication (no DB call)
  app.use(async (req, res, next) => {
    try {
      // Create a RequestLike adapter for Express Request
      const requestLike = {
        headers: {
          get: (name: string): string | null => {
            const value = req.headers[name.toLowerCase()];
            if (Array.isArray(value)) {
              return value[0] || null;
            }
            return (value as string) || null;
          }
        },
        cookies: req.headers.cookie || ''
      };
      
      const stackUser = await stackServerApp.getUser({ tokenStore: requestLike as any });
      if (stackUser) {
        (req as any).stackUserId = stackUser.id; // No DB call!
      }
      // If no stackUser, stackUserId will be undefined - routes can handle this
    } catch (error) {
      // If auth fails, stackUserId will be undefined
      console.error('Auth middleware error:', error);
    }
    next();
  });

  // Debug middleware to log all API requests
  app.use((req, res, next) => {
    if (req.path.startsWith("/api")) {
      console.log(`[API Request] ${req.method} ${req.path} ${req.url}`);
    }
    next();
  });

  app.use((req, res, next) => {
    const start = Date.now();
    const path = req.path;
    let capturedJsonResponse: Record<string, any> | undefined = undefined;

    const originalResJson = res.json;
    res.json = function (bodyJson, ...args) {
      capturedJsonResponse = bodyJson;
      return originalResJson.apply(res, [bodyJson, ...args]);
    };

    res.on("finish", () => {
      const duration = Date.now() - start;
      if (path.startsWith("/api")) {
        let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
        if (capturedJsonResponse) {
          logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
        }

        if (logLine.length > 80) {
          logLine = logLine.slice(0, 79) + "…";
        }

        log(logLine);
      }
    });

    next();
  });

  return app;
}

export async function setupApp(app: Express, server?: Server): Promise<void> {
  await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // Catch-all for unmatched API routes (before Vite)
  app.use("/api/*", (req, res) => {
    console.error(`[UNMATCHED API ROUTE] ${req.method} ${req.path} ${req.url}`);
    res.status(404).json({ message: `API route not found: ${req.method} ${req.path}` });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development" && server) {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
}

// Start server if not in Vercel production environment
// Vercel dev mode sets VERCEL but VERCEL_ENV is not 'production'
const isVercelProduction = process.env.VERCEL && process.env.VERCEL_ENV === 'production';
const shouldStartServer = !isVercelProduction;

if (shouldStartServer) {
  (async () => {
    const app = await createApp();
    const server = createServer(app);
    await setupApp(app, server);

    const port = Number(process.env.PORT) || 8000;
    server.listen({
      port,
      host: "0.0.0.0",
      reusePort: false,
    }, () => {
      log(`serving on port ${port}`);
    });
  })();
}
