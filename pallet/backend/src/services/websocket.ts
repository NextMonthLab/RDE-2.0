/**
 * WebSocket Service for RDE v2.0 Hetzner Deployment Pallet
 */

import { WebSocketServer, WebSocket } from 'ws';
import { nanoid } from 'nanoid';

interface WebSocketClient {
  id: string;
  ws: WebSocket;
  isAlive: boolean;
  lastPing: Date;
}

const clients = new Map<string, WebSocketClient>();

export function setupWebSocket(wss: WebSocketServer): void {
  wss.on('connection', (ws: WebSocket) => {
    const clientId = nanoid();
    const client: WebSocketClient = {
      id: clientId,
      ws,
      isAlive: true,
      lastPing: new Date(),
    };

    clients.set(clientId, client);
    console.log(`[WebSocket] Client connected: ${clientId}`);

    // Send welcome message
    ws.send(JSON.stringify({
      type: 'connection',
      clientId,
      message: 'Connected to RDE v2.0 WebSocket server',
      timestamp: new Date().toISOString(),
    }));

    // Handle incoming messages
    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        await handleMessage(clientId, message);
      } catch (error) {
        console.error(`[WebSocket] Error parsing message from ${clientId}:`, error);
        ws.send(JSON.stringify({
          type: 'error',
          error: 'Invalid message format',
          timestamp: new Date().toISOString(),
        }));
      }
    });

    // Handle pong responses
    ws.on('pong', () => {
      const client = clients.get(clientId);
      if (client) {
        client.isAlive = true;
        client.lastPing = new Date();
      }
    });

    // Handle disconnection
    ws.on('close', () => {
      clients.delete(clientId);
      console.log(`[WebSocket] Client disconnected: ${clientId}`);
    });

    // Handle errors
    ws.on('error', (error) => {
      console.error(`[WebSocket] Error for client ${clientId}:`, error);
      clients.delete(clientId);
    });
  });

  // Set up ping interval to keep connections alive
  const pingInterval = setInterval(() => {
    clients.forEach((client, clientId) => {
      if (!client.isAlive) {
        client.ws.terminate();
        clients.delete(clientId);
        return;
      }

      client.isAlive = false;
      client.ws.ping();
    });
  }, 30000); // Ping every 30 seconds

  wss.on('close', () => {
    clearInterval(pingInterval);
  });

  console.log('[WebSocket] Server initialized with ping/pong heartbeat');
}

async function handleMessage(clientId: string, message: any): Promise<void> {
  const client = clients.get(clientId);
  if (!client) return;

  switch (message.type) {
    case 'terminal':
      await handleTerminalMessage(client, message);
      break;
    
    case 'ping':
      client.ws.send(JSON.stringify({
        type: 'pong',
        timestamp: new Date().toISOString(),
      }));
      break;
    
    default:
      client.ws.send(JSON.stringify({
        type: 'error',
        error: `Unknown message type: ${message.type}`,
        timestamp: new Date().toISOString(),
      }));
  }
}

async function handleTerminalMessage(client: WebSocketClient, message: any): Promise<void> {
  // Basic terminal command handling
  // In production, this would integrate with a proper terminal emulator
  
  const { command } = message;
  
  if (!command) {
    client.ws.send(JSON.stringify({
      type: 'terminal',
      output: 'Error: No command provided\r\n',
      timestamp: new Date().toISOString(),
    }));
    return;
  }

  // Simple echo for now - in production this would execute actual commands
  client.ws.send(JSON.stringify({
    type: 'terminal',
    output: `$ ${command}\r\n`,
    timestamp: new Date().toISOString(),
  }));

  // Simulate command execution
  setTimeout(() => {
    client.ws.send(JSON.stringify({
      type: 'terminal',
      output: `Command executed: ${command}\r\n`,
      timestamp: new Date().toISOString(),
    }));
  }, 100);
}

export function broadcastMessage(message: any): void {
  const messageStr = JSON.stringify({
    ...message,
    timestamp: new Date().toISOString(),
  });

  clients.forEach((client) => {
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(messageStr);
    }
  });
}

export function getConnectedClients(): number {
  return clients.size;
}