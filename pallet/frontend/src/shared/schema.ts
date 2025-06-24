// Shared schema types for RDE 2.0 Frontend
export interface File {
  id: string;
  name: string;
  path: string;
  parentPath?: string;
  content?: string;
  size?: number;
  type: 'file' | 'directory';
  isDirectory: boolean;
  children?: File[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  metadata?: {
    intentsParsed?: number;
    executionResults?: any[];
  };
}

export interface MiddlewareStatus {
  isActive: boolean;
  intentsParsed: number;
  successfulExecutions: number;
  failedExecutions: number;
  pendingApprovals: number;
}

export interface ExecutionResult {
  success: boolean;
  intentId: string;
  operation: string;
  targetPath: string;
  output?: string;
  error?: string;
  duration: number;
  timestamp: Date;
}