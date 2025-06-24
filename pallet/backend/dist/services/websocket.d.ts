/**
 * WebSocket Service for RDE v2.0 Hetzner Deployment Pallet
 */
import { WebSocketServer } from 'ws';
export declare function setupWebSocket(wss: WebSocketServer): void;
export declare function broadcastMessage(message: any): void;
export declare function getConnectedClients(): number;
//# sourceMappingURL=websocket.d.ts.map