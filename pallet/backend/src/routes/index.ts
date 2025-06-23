/**
 * API Routes for RDE v2.0 Hetzner Deployment Pallet
 */

import express, { Express } from 'express';
import { Server } from 'http';
import filesRouter from './files.js';
import chatRouter from './chat.js';
import middlewareRouter from './middleware.js';
import executionRouter from './execution.js';

export async function registerRoutes(app: Express, server: Server): Promise<Server> {
  // API routes
  app.use('/api/files', filesRouter);
  app.use('/api/chat', chatRouter);
  app.use('/api/middleware', middlewareRouter);
  app.use('/api/execution', executionRouter);

  console.log('[Routes] All API routes registered successfully');
  
  return server;
}