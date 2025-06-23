import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { fileService } from "./services/fileService";
import { terminalService } from "./services/terminalService";
import { chatService } from "./services/chatService";
import { insertFileSchema, insertChatMessageSchema } from "@shared/schema";

// Helper function to create middleware summary
function createMiddlewareSummary(middlewareResult: any): string {
  const { summary } = middlewareResult;
  
  if (summary.totalIntents === 0) {
    return "";
  }

  let summaryText = "\n🤖 **Middleware Processing Summary:**\n";
  
  if (summary.executedIntents > 0) {
    summaryText += `✅ Executed ${summary.executedIntents} intent(s) successfully\n`;
  }
  
  if (summary.rejectedIntents > 0) {
    summaryText += `❌ Rejected ${summary.rejectedIntents} intent(s) due to governance rules\n`;
  }
  
  if (summary.pendingApprovals > 0) {
    summaryText += `⏳ ${summary.pendingApprovals} intent(s) require manual approval\n`;
  }

  return summaryText;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize file service
  await fileService.initializeProjectsDirectory();

  // Initialize Agent Bridge Middleware
  try {
    const { agentBridge } = await import('../middleware/agentBridge');
    await agentBridge.initialize({
      enableIntentParsing: true,
      enableGovernance: true, 
      enableExecution: true,
      enableAudit: true,
    });
    console.log("[Routes] Agent Bridge Middleware activated successfully");
  } catch (error) {
    console.error("[Routes] Failed to initialize Agent Bridge Middleware:", error);
  }

  // Initialize Execution Engine
  try {
    const { executionEngine } = await import('./services/execution-engine/index');
    await executionEngine.initialize();
    executionEngine.subscribeToMiddlewareEvents();
    console.log("[Routes] Execution Engine v1.0 initialized successfully");
  } catch (error) {
    console.error("[Routes] Failed to initialize Execution Engine:", error);
  }

  // File operations
  app.get("/api/files", async (req, res) => {
    try {
      const parentPath = req.query.parentPath as string;
      const files = await storage.getFiles(parentPath || undefined);
      res.json(files);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch files" });
    }
  });

  app.get("/api/files/*", async (req, res) => {
    try {
      const filePath = "/" + (req.params as any)[0];
      const file = await storage.getFile(filePath);
      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }
      res.json(file);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch file" });
    }
  });

  app.post("/api/files", async (req, res) => {
    try {
      const fileData = insertFileSchema.parse(req.body);
      const file = await fileService.createFileInStorage(
        fileData.name,
        fileData.path,
        fileData.content || "",
        fileData.type as "file" | "directory",
        fileData.parentPath || undefined
      );
      res.json(file);
    } catch (error) {
      res.status(400).json({ error: "Invalid file data" });
    }
  });

  app.put("/api/files/*", async (req, res) => {
    try {
      const filePath = "/" + (req.params as any)[0];
      const updates = req.body;
      const file = await fileService.updateFileInStorage(filePath, updates);
      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }
      res.json(file);
    } catch (error) {
      res.status(500).json({ error: "Failed to update file" });
    }
  });

  app.delete("/api/files/*", async (req, res) => {
    try {
      const filePath = "/" + (req.params as any)[0];
      const success = await fileService.deleteFileInStorage(filePath);
      if (!success) {
        return res.status(404).json({ error: "File not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete file" });
    }
  });

  // Chat operations
  app.get("/api/chat/messages", async (req, res) => {
    try {
      const messages = await storage.getChatMessages();
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch chat messages" });
    }
  });

  app.post("/api/chat/message", async (req, res) => {
    try {
      const messageData = insertChatMessageSchema.parse(req.body);
      
      // Store user message
      const userMessage = await storage.addChatMessage(messageData);
      
      // Generate AI response
      const files = await storage.getFiles();
      const context = {
        files: files.map(f => f.path),
        currentFile: req.body.currentFile,
      };
      
      const aiResponse = await chatService.processMessage(messageData.content, context);
      
      // Store AI response
      const assistantMessage = await storage.addChatMessage({
        content: aiResponse,
        role: "assistant",
      });

      res.json({
        userMessage,
        assistantMessage,
      });
    } catch (error) {
      console.error("Chat error:", error);
      res.status(400).json({ error: "Failed to process chat message" });
    }
  });

  app.delete("/api/chat/messages", async (req, res) => {
    try {
      await storage.clearChatMessages();
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to clear chat messages" });
    }
  });

  const httpServer = createServer(app);

  // WebSocket server for terminal and real-time features
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws: WebSocket) => {
    console.log('WebSocket connection established');
    
    let terminalSessionId: string | null = null;

    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        switch (message.type) {
          case 'terminal:create':
            terminalSessionId = message.sessionId || `session_${Date.now()}`;
            const session = terminalService.createSession(terminalSessionId, message.cwd || process.cwd());
            
            // Forward stdout
            session.process.stdout?.on('data', (data) => {
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                  type: 'terminal:output',
                  sessionId: terminalSessionId,
                  data: data.toString(),
                }));
              }
            });

            // Forward stderr
            session.process.stderr?.on('data', (data) => {
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                  type: 'terminal:output',
                  sessionId: terminalSessionId,
                  data: data.toString(),
                }));
              }
            });

            // Handle process exit
            session.process.on('exit', (code) => {
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                  type: 'terminal:exit',
                  sessionId: terminalSessionId,
                  code,
                }));
              }
            });

            ws.send(JSON.stringify({
              type: 'terminal:created',
              sessionId: terminalSessionId,
            }));
            break;

          case 'terminal:input':
            if (terminalSessionId) {
              terminalService.executeCommand(terminalSessionId, message.data);
            }
            break;

          case 'terminal:kill':
            if (terminalSessionId) {
              terminalService.killSession(terminalSessionId);
              terminalSessionId = null;
            }
            break;

          case 'file:watch':
            // File watching for hot reload
            ws.send(JSON.stringify({
              type: 'file:changed',
              path: message.path,
            }));
            break;

          default:
            console.log('Unknown WebSocket message type:', message.type);
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Invalid message format',
        }));
      }
    });

    ws.on('close', () => {
      console.log('WebSocket connection closed');
      if (terminalSessionId) {
        terminalService.killSession(terminalSessionId);
      }
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });

  return httpServer;
}
