/**
 * Execution Engine API Routes for RDE v2.0 Hetzner Deployment Pallet
 */

import express from 'express';
import { executionEngine } from '../services/execution-engine/index.js';

const router = express.Router();

// Get execution engine statistics
router.get('/stats', (req, res) => {
  try {
    const stats = executionEngine.getStats();
    return res.json({
      ...stats,
      workspaceRoot: executionEngine.getWorkspaceRoot(),
      connectedClients: 0, // Placeholder for WebSocket client count
      status: 'active',
    });
  } catch (error) {
    console.error('[Execution] Error getting stats:', error);
    return res.status(500).json({ error: 'Failed to get execution statistics' });
  }
});

// Get processing queue status
router.get('/queue', (req, res) => {
  try {
    const stats = executionEngine.getStats();
    res.json({
      queueLength: stats.queueLength || 0,
      isProcessing: false, // Placeholder
      lastProcessed: stats.lastOperationTime,
      status: 'ready',
    });
  } catch (error) {
    console.error('[Execution] Error getting queue status:', error);
    res.status(500).json({ error: 'Failed to get queue status' });
  }
});

// Manual execution trigger (for testing)
router.post('/execute', async (req, res): Promise<void> => {
  try {
    const { operation, targetPath, content } = req.body;
    
    if (!operation || !targetPath) {
      return res.status(400).json({ 
        error: 'Operation and targetPath are required' 
      });
    }

    const event = {
      intentId: `manual-${Date.now()}`,
      operation,
      targetPath,
      content,
      timestamp: new Date(),
      userId: 'manual-user',
      sessionId: 'manual-session',
    };

    await executionEngine.queueApprovedIntent(event);
    
    res.json({
      message: 'Execution queued successfully',
      event,
    });
  } catch (error) {
    console.error('[Execution] Error queuing execution:', error);
    return res.status(500).json({ error: 'Failed to queue execution' });
  }
});

export default router;