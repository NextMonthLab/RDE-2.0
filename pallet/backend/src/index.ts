import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';

import { registerRoutes } from './routes/index.js';
import { setupWebSocket } from './services/websocket.js';
import { initializeMiddleware } from './services/middleware/index.js';
import { initializeExecutionEngine } from './services/execution-engine/index.js';
import { createDirectories } from './utils/filesystem.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const server = createServer(app);
  const port = process.env.PORT || 5000;

  // Security middleware
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'", "'unsafe-eval'"],
        imgSrc: ["'self'", "data:", "blob:"],
        connectSrc: ["'self'", "ws:", "wss:"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
  }));

  app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  }));

  app.use(morgan('combined'));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Create required directories
  await createDirectories();

  // Initialize core services
  console.log('[Server] Initializing Agent Bridge Middleware...');
  await initializeMiddleware();

  console.log('[Server] Initializing Execution Engine...');
  await initializeExecutionEngine();

  // Setup WebSocket
  const wss = new WebSocketServer({ 
    server, 
    path: '/ws',
    clientTracking: true 
  });
  
  setupWebSocket(wss);

  // Register API routes
  await registerRoutes(app, server);

  // Serve static files in production
  if (process.env.NODE_ENV === 'production') {
    const frontendPath = path.resolve(__dirname, '../../frontend/dist');
    app.use(express.static(frontendPath));
    
    app.get('*', (req, res) => {
      res.sendFile(path.join(frontendPath, 'index.html'));
    });
  }

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '2.0.0',
      environment: process.env.NODE_ENV || 'development',
      middleware: 'active',
      executionEngine: 'active'
    });
  });

  // Error handling middleware
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('[Server] Error:', err);
    
    if (res.headersSent) {
      return next(err);
    }
    
    res.status(err.status || 500).json({
      error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
      timestamp: new Date().toISOString(),
    });
  });

  // Start server
  server.listen(port, '0.0.0.0', () => {
    console.log(`[Server] RDE v2.0 Hetzner Pallet running on port ${port}`);
    console.log(`[Server] Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`[Server] Frontend: ${process.env.NODE_ENV === 'production' ? 'Static' : 'Vite Dev Server'}`);
    console.log(`[Server] WebSocket: ws://localhost:${port}/ws`);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('[Server] SIGTERM received, shutting down gracefully...');
    server.close(() => {
      console.log('[Server] Process terminated');
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    console.log('[Server] SIGINT received, shutting down gracefully...');
    server.close(() => {
      console.log('[Server] Process terminated');
      process.exit(0);
    });
  });
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('[Server] Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('[Server] Uncaught Exception thrown:', error);
  process.exit(1);
});

startServer().catch(console.error);