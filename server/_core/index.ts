import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import rateLimit from "express-rate-limit";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { initializeSocket } from "../socket";
import { registerExternalApiRoutes } from "../externalApi";
import { runScheduledMultiStream } from "../streamScheduleHandler";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  
  // Trust proxy for rate limiting behind reverse proxies
  app.set("trust proxy", 1);
  
  // Initialize Socket.io for real-time updates
  initializeSocket(server);
  
  // ============================================
  // SECURITY MIDDLEWARE
  // ============================================
  
  // Security headers
  app.use((req, res, next) => {
    // Prevent clickjacking
    res.setHeader("X-Frame-Options", "DENY");
    // Prevent MIME type sniffing
    res.setHeader("X-Content-Type-Options", "nosniff");
    // Enable XSS filter in browsers
    res.setHeader("X-XSS-Protection", "1; mode=block");
    // Referrer policy
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    // WebMCP requires an origin-keyed agent cluster and the tools permission.
    // Keep tools same-origin only; no cross-origin exposure is enabled.
    res.setHeader("Origin-Agent-Cluster", "?1");
    res.setHeader("Permissions-Policy", "tools=(self)");
    // Content Security Policy (relaxed for development)
    if (process.env.NODE_ENV === "production") {
      res.setHeader(
        "Content-Security-Policy",
        "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' wss: https:;"
      );
    }
    // Strict Transport Security (only in production with HTTPS)
    if (process.env.NODE_ENV === "production") {
      res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    }
    next();
  });
  
  // Rate limiting for API endpoints
  const apiLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute window
    max: 100, // 100 requests per minute per IP
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many requests, please try again later." },
    skip: (req) => {
      // Skip rate limiting for health checks
      return req.path === "/api/trpc/system.health";
    },
  });
  
  // Stricter rate limiting for authentication endpoints
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // 20 attempts per 15 minutes
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many authentication attempts, please try again later." },
  });
  
  // Stricter rate limiting for registration/creation endpoints
  const createLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 30, // 30 creations per hour
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many creation requests, please try again later." },
  });
  
  // Apply rate limiters
  app.use("/api/oauth", authLimiter);
  app.use("/api/trpc", apiLimiter);
  
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);

  // Stable, versioned API surface for external agents and SDKs.
  registerExternalApiRoutes(app);

  // Durable Heartbeat callback for end-user multi-platform schedules.
  app.post("/api/scheduled/startMultiStream", runScheduledMultiStream);
  
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
    console.log(`WebSocket server ready on ws://localhost:${port}/socket.io`);
    console.log(`Security: Rate limiting and headers enabled`);
  });
}

startServer().catch(console.error);
