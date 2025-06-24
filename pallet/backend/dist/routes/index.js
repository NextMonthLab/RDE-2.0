/**
 * API Routes for RDE v2.0 Hetzner Deployment Pallet
 */
import filesRouter from './files.js';
import chatRouter from './chat.js';
import middlewareRouter from './middleware.js';
import executionRouter from './execution.js';
export async function registerRoutes(app, server) {
    // API routes
    app.use('/api/files', filesRouter);
    app.use('/api/chat', chatRouter);
    app.use('/api/middleware', middlewareRouter);
    app.use('/api/execution', executionRouter);
    console.log('[Routes] All API routes registered successfully');
    return server;
}
//# sourceMappingURL=index.js.map