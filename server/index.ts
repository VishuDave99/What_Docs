import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { setupNvidiaEnvironment } from "./gpu-setup";
import { errorHandler, setupGlobalErrorHandlers } from "./error-handler";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

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

(async () => {
  // Initialize NVIDIA GPU support
  log('Checking for NVIDIA GPU...', 'startup');
  const gpuInfo = setupNvidiaEnvironment();
  
  if (gpuInfo.available) {
    log(`NVIDIA GPU detected: ${gpuInfo.gpuName}`, 'startup');
    log(`Driver Version: ${gpuInfo.driverVersion}`, 'startup');
  } else {
    log('No NVIDIA GPU detected, running in CPU mode', 'startup');
  }
  
  const server = await registerRoutes(app);

  // Setup global error handlers for uncaught exceptions
  setupGlobalErrorHandlers();
  
  // Apply error handler middleware
  app.use(errorHandler);

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Configure port to be compatible with both local development and Replit
  // In a real deployment, just use process.env.PORT as provided by the environment
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 5000;
  
  // Listen on the port with 0.0.0.0 to make it accessible from outside the container
  // Windows doesn't support reusePort, so we need to check the platform
  const serverOptions = process.platform === 'win32' 
    ? { port, host: "0.0.0.0" }  // Windows configuration
    : { port, host: "0.0.0.0", reusePort: true };  // Unix/Linux configuration
    
  server.listen(serverOptions, () => {
    log(`serving on port ${port}`);
  });
})();
