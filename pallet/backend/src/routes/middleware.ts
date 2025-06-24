/**
 * Middleware API Routes for RDE v2.0 Hetzner Deployment Pallet
 */

import express from 'express';
import { agentBridge } from '../services/middleware/index.js';

const router = express.Router();

// Get middleware status
router.get('/status', (req, res) => {
  try {
    const status = agentBridge.getHealthStatus();
    res.json({
      ...status,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      nodeVersion: process.version,
    });
  } catch (error) {
    console.error('[Middleware] Error getting status:', error);
    res.status(500).json({ error: 'Failed to get middleware status' });
  }
});

// Get audit statistics
router.get('/audit', async (req, res) => {
  try {
    const days = parseInt(req.query.days as string) || 7;
    const stats = await agentBridge.getAuditStatistics(days);
    res.json(stats);
  } catch (error) {
    console.error('[Middleware] Error getting audit stats:', error);
    res.status(500).json({ error: 'Failed to get audit statistics' });
  }
});

// Get current configuration
router.get('/config', (req, res) => {
  try {
    const config = agentBridge.getConfig();
    res.json(config);
  } catch (error) {
    console.error('[Middleware] Error getting config:', error);
    res.status(500).json({ error: 'Failed to get configuration' });
  }
});

// Get pending approvals (placeholder for future implementation)
router.get('/approvals', (req, res) => {
  try {
    // This would return pending intents requiring manual approval
    res.json({
      pending: [],
      total: 0,
      message: 'Approval system ready for implementation',
    });
  } catch (error) {
    console.error('[Middleware] Error getting approvals:', error);
    res.status(500).json({ error: 'Failed to get pending approvals' });
  }
});

// Process intent manually (for testing)
router.post('/process', async (req, res) => {
  try {
    const { message, sessionId = 'manual-session', userId = 'manual-user' } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const result = await agentBridge.processChatMessage(message, sessionId, {
      userId,
      autoExecute: true,
    });

    return res.json(result);
  } catch (error) {
    console.error('[Middleware] Error processing intent:', error);
    return res.status(500).json({ error: 'Failed to process intent' });
  }
});

export default router;