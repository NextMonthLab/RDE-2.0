/**
 * Intent Parser - Agent Bridge Middleware v2.0
 * Extracts structured intents from AI chat outputs
 */

import { nanoid } from 'nanoid';
import type { 
  Intent, 
  FileOperationIntent, 
  TerminalCommandIntent, 
  CodeGenerationIntent, 
  ParsedChatOutput 
} from './types.js';

export class IntentParser {
  private static readonly INTENT_PATTERNS = {
    FILE_CREATE: /(?:create|add|new)\s+(?:file|component|page)\s+(?:called\s+)?["`']?([^"`'\s]+)["`']?/gi,
    FILE_UPDATE: /(?:update|modify|edit|change)\s+(?:file\s+)?["`']?([^"`'\s]+)["`']?/gi,
    FILE_DELETE: /(?:delete|remove)\s+(?:file\s+)?["`']?([^"`'\s]+)["`']?/gi,
    TERMINAL_COMMAND: /(?:run|execute|cmd)[\s:]+["`']?([^"`'\n]+)["`']?/gi,
    CODE_GENERATION: /(?:generate|create|build)\s+(?:a\s+)?(?:react\s+)?(?:component|function|class|module)\s+(?:called\s+)?["`']?([^"`'\s]+)["`']?/gi,
  };

  private static readonly CODE_BLOCK_PATTERN = /```(\w+)?\n([\s\S]*?)```/g;
  private static readonly FILE_PATH_PATTERN = /(?:\/[\w\-\.]+)+\.\w+/g;

  /**
   * Parse AI chat message and extract structured intents
   */
  public static parseChatMessage(message: string, sessionId: string): ParsedChatOutput {
    const startTime = Date.now();
    const intents: Intent[] = [];
    const parseErrors: string[] = [];

    try {
      // Extract different types of intents
      intents.push(...this.extractFileOperationIntents(message));
      intents.push(...this.extractTerminalCommandIntents(message));
      intents.push(...this.extractCodeGenerationIntents(message));
      intents.push(...this.extractCodeBlockIntents(message));

      // Remove duplicates by ID
      const uniqueIntents = intents.filter((intent, index, self) => 
        index === self.findIndex(i => i.id === intent.id)
      );

      const confidence = this.calculateConfidence(message, uniqueIntents);
      const parseTime = Date.now() - startTime;

      return {
        originalMessage: message,
        intents: uniqueIntents,
        confidence,
        parseErrors,
        metadata: {
          modelUsed: 'intent-parser-v2',
          parseTime,
          intentCount: uniqueIntents.length,
        },
      };
    } catch (error) {
      parseErrors.push(`Parse error: ${error instanceof Error ? error.message : String(error)}`);
      
      return {
        originalMessage: message,
        intents: [],
        confidence: 0,
        parseErrors,
        metadata: {
          modelUsed: 'intent-parser-v2',
          parseTime: Date.now() - startTime,
          intentCount: 0,
        },
      };
    }
  }

  /**
   * Extract file operation intents from message
   */
  private static extractFileOperationIntents(message: string): FileOperationIntent[] {
    const intents: FileOperationIntent[] = [];
    
    // Create file operations
    const createMatches = [...message.matchAll(this.INTENT_PATTERNS.FILE_CREATE)];
    for (const match of createMatches) {
      const fileName = match[1];
      if (fileName) {
        intents.push(this.createFileOperationIntent('create', fileName, undefined, message));
      }
    }

    // Update file operations
    const updateMatches = [...message.matchAll(this.INTENT_PATTERNS.FILE_UPDATE)];
    for (const match of updateMatches) {
      const fileName = match[1];
      if (fileName) {
        intents.push(this.createFileOperationIntent('update', fileName, undefined, message));
      }
    }

    // Delete file operations
    const deleteMatches = [...message.matchAll(this.INTENT_PATTERNS.FILE_DELETE)];
    for (const match of deleteMatches) {
      const fileName = match[1];
      if (fileName) {
        intents.push(this.createFileOperationIntent('delete', fileName, undefined, message));
      }
    }

    return intents;
  }

  /**
   * Extract terminal command intents from message
   */
  private static extractTerminalCommandIntents(message: string): TerminalCommandIntent[] {
    const intents: TerminalCommandIntent[] = [];
    
    const matches = [...message.matchAll(this.INTENT_PATTERNS.TERMINAL_COMMAND)];
    for (const match of matches) {
      const command = match[1]?.trim();
      if (command) {
        intents.push(this.createTerminalCommandIntent(command));
      }
    }

    return intents;
  }

  /**
   * Extract code generation intents from message
   */
  private static extractCodeGenerationIntents(message: string): CodeGenerationIntent[] {
    const intents: CodeGenerationIntent[] = [];
    
    const matches = [...message.matchAll(this.INTENT_PATTERNS.CODE_GENERATION)];
    for (const match of matches) {
      const componentName = match[1];
      if (componentName) {
        intents.push(this.createCodeGenerationIntent(componentName, message));
      }
    }

    return intents;
  }

  /**
   * Extract intents from code blocks in the message
   */
  private static extractCodeBlockIntents(message: string): Intent[] {
    const intents: Intent[] = [];
    
    const codeBlocks = [...message.matchAll(this.CODE_BLOCK_PATTERN)];
    for (const block of codeBlocks) {
      const language = block[1] || 'javascript';
      const code = block[2];
      
      if (code && code.trim().length > 20) {
        // Suggest a filename based on content analysis
        const suggestedPath = this.suggestFilePath(language, 'generated');
        
        intents.push(this.createFileOperationIntent(
          'create',
          suggestedPath,
          code.trim(),
          message
        ));
      }
    }

    return intents;
  }

  /**
   * Create a file operation intent
   */
  private static createFileOperationIntent(
    operation: 'create' | 'update' | 'delete',
    path: string,
    content?: string,
    originalMessage?: string
  ): FileOperationIntent {
    const fileType = this.getFileType(path);
    
    return {
      id: nanoid(),
      type: 'file_operation',
      operation,
      target: {
        path: path.startsWith('/') ? path : `/${path}`,
        content,
        backup: operation === 'update',
      },
      validation: {
        fileType,
        sizeLimit: 1048576, // 1MB
        permissions: ['read', 'write'],
      },
      timestamp: new Date(),
      source: 'ai_chat',
      priority: operation === 'delete' ? 'high' : 'medium',
      metadata: {
        originalMessage: originalMessage?.substring(0, 200),
      },
    };
  }

  /**
   * Create a terminal command intent
   */
  private static createTerminalCommandIntent(command: string): TerminalCommandIntent {
    return {
      id: nanoid(),
      type: 'terminal_command',
      command,
      timeout: 30000,
      validation: {
        requireConfirmation: this.requiresConfirmation(command),
        allowedCommands: ['ls', 'pwd', 'cat', 'echo', 'node', 'npm'],
        restrictedPaths: ['/etc', '/usr', '/var'],
      },
      timestamp: new Date(),
      source: 'ai_chat',
      priority: this.getCommandPriority(command),
    };
  }

  /**
   * Create a code generation intent
   */
  private static createCodeGenerationIntent(
    name: string,
    originalMessage: string
  ): CodeGenerationIntent {
    const language = originalMessage.toLowerCase().includes('typescript') ? 'typescript' : 'javascript';
    const isReact = originalMessage.toLowerCase().includes('react') || originalMessage.toLowerCase().includes('component');
    
    return {
      id: nanoid(),
      type: 'code_generation',
      target: {
        file: this.suggestFilePath(language, name),
        component: isReact ? name : undefined,
      },
      requirements: {
        language,
        framework: isReact ? 'react' : undefined,
        patterns: ['functional', 'modern'],
        tests: false,
      },
      context: {
        existingCode: undefined,
        imports: isReact ? ['react'] : [],
        dependencies: [],
      },
      timestamp: new Date(),
      source: 'ai_chat',
      priority: 'medium',
      metadata: {
        originalMessage: originalMessage.substring(0, 200),
      },
    };
  }

  /**
   * Calculate confidence score for parsed intents
   */
  private static calculateConfidence(message: string, intents: Intent[]): number {
    if (intents.length === 0) return 0;
    
    let score = 0;
    const totalWords = message.split(/\s+/).length;
    
    // Base score from intent detection
    score += Math.min(intents.length * 20, 60);
    
    // Bonus for specific keywords
    const keywords = ['create', 'update', 'delete', 'generate', 'build', 'run', 'execute'];
    const foundKeywords = keywords.filter(keyword => 
      message.toLowerCase().includes(keyword)
    ).length;
    score += foundKeywords * 5;
    
    // Bonus for file patterns
    const fileMatches = [...message.matchAll(this.FILE_PATH_PATTERN)];
    score += Math.min(fileMatches.length * 10, 30);
    
    // Penalty for very short or very long messages
    if (totalWords < 3) score -= 20;
    if (totalWords > 100) score -= 10;
    
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Utility methods
   */
  private static getFileType(path: string): string {
    const ext = path.split('.').pop()?.toLowerCase();
    const typeMap: Record<string, string> = {
      'js': 'javascript',
      'jsx': 'javascript-react',
      'ts': 'typescript',
      'tsx': 'typescript-react',
      'json': 'json',
      'md': 'markdown',
      'css': 'css',
      'html': 'html',
      'txt': 'text',
    };
    return typeMap[ext || ''] || 'unknown';
  }

  private static getCommandPriority(command: string): 'low' | 'medium' | 'high' | 'critical' {
    if (command.includes('rm ') || command.includes('delete') || command.includes('format')) {
      return 'critical';
    }
    if (command.includes('install') || command.includes('update') || command.includes('build')) {
      return 'high';
    }
    if (command.includes('run') || command.includes('start') || command.includes('test')) {
      return 'medium';
    }
    return 'low';
  }

  private static requiresConfirmation(command: string): boolean {
    const dangerousCommands = ['rm', 'delete', 'format', 'kill', 'sudo', 'chmod', 'chown'];
    return dangerousCommands.some(dangerous => command.includes(dangerous));
  }

  private static suggestFilePath(type: string, name: string): string {
    const extensions: Record<string, string> = {
      'javascript': '.js',
      'typescript': '.ts',
      'jsx': '.jsx',
      'tsx': '.tsx',
      'json': '.json',
      'css': '.css',
      'html': '.html',
      'markdown': '.md',
    };
    
    const ext = extensions[type] || '.txt';
    const cleanName = name.replace(/[^a-zA-Z0-9-_]/g, '');
    
    return `/src/components/${cleanName}${ext}`;
  }
}