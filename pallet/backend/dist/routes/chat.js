/**
 * Chat API Routes for RDE v2.0 Hetzner Deployment Pallet
 */
import express from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { agentBridge } from '../services/middleware/index.js';
const router = express.Router();
// In-memory message storage (in production, use a database)
const messages = [];
const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY || '',
});
// Get chat messages
router.get('/messages', (req, res) => {
    return res.json(messages);
});
// Send chat message
router.post('/message', async (req, res) => {
    try {
        const { content, role = 'user', currentFile } = req.body;
        if (!content) {
            return res.status(400).json({ error: 'Message content is required' });
        }
        // Add user message
        const userMessage = {
            id: `user-${Date.now()}`,
            content,
            role: 'user',
            timestamp: new Date(),
        };
        messages.push(userMessage);
        // Process through Agent Bridge Middleware
        const middlewareResult = await agentBridge.processChatMessage(content, `session-${Date.now()}`, {
            userId: 'default-user',
            autoExecute: true,
            currentFile,
        });
        // Generate AI response
        let aiResponse = '';
        try {
            const response = await anthropic.messages.create({
                model: 'claude-3-5-sonnet-20241022',
                max_tokens: 1024,
                messages: [
                    {
                        role: 'user',
                        content: `You are an AI assistant helping with development in RDE v2.0. 
            
User request: ${content}
Current file: ${currentFile || 'none'}

Provide a helpful response about the development task. If file operations were processed by the middleware, acknowledge them.

Middleware processed ${middlewareResult.results.length} intents with the following outcomes:
${middlewareResult.results.map(r => `- ${r.intent.type}: ${r.execution?.success ? 'success' : 'pending/failed'}`).join('\n')}`,
                    },
                ],
            });
            aiResponse = response.content[0].type === 'text' ? response.content[0].text : 'I apologize, but I encountered an error processing your request.';
        }
        catch (error) {
            console.error('[Chat] Anthropic API error:', error);
            aiResponse = 'I apologize, but I encountered an error while processing your request. Please check the API configuration and try again.';
        }
        // Add AI response
        const assistantMessage = {
            id: `assistant-${Date.now()}`,
            content: aiResponse,
            role: 'assistant',
            timestamp: new Date(),
        };
        messages.push(assistantMessage);
        // Keep only last 50 messages to prevent memory issues
        if (messages.length > 50) {
            messages.splice(0, messages.length - 50);
        }
        return res.json({
            userMessage,
            assistantMessage,
            middlewareResult: {
                intentsProcessed: middlewareResult.results.length,
                successfulExecutions: middlewareResult.results.filter(r => r.execution?.success).length,
            },
        });
    }
    catch (error) {
        console.error('[Chat] Error processing message:', error);
        return res.status(500).json({ error: 'Failed to process message' });
    }
});
// Clear chat history
router.delete('/messages', (req, res) => {
    messages.length = 0;
    res.json({ message: 'Chat history cleared' });
});
export default router;
//# sourceMappingURL=chat.js.map