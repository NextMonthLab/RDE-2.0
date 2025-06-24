/**
 * Intent Parser - Agent Bridge Middleware v2.0
 * Extracts structured intents from AI chat outputs
 */

import { Intent, ParsedChatOutput, IntentType, FileOperationIntent, TerminalCommandIntent, CodeGenerationIntent } from './types';
import { nanoid } from 'nanoid';

export class IntentParser {
  private static readonly INTENT_PATTERNS = {
    file_operation: [
      /create\s+(?:a\s+)?(?:new\s+)?file\s+(?:called\s+|named\s+)?["`']([^"`']+)["`']/gi,
      /(?:write|save)\s+(?:to\s+)?["`']([^"`']+)["`']/gi,
      /update\s+(?:the\s+)?file\s+["`']([^"`']+)["`']/gi,
      /delete\s+(?:the\s+)?file\s+["`']([^"`']+)["`']/gi,
      /rename\s+["`']([^"`']+)["`']\s+to\s+["`']([^"`']+)["`']/gi,
    ],
    terminal_command: [
      /run\s+(?:the\s+)?command\s+["`']([^"`']+)["`']/gi,
      /execute\s+["`']([^"`']+)["`']/gi,
      /npm\s+(?:install|run|start|build|test)\s+([^\s]+)/gi,
      /cd\s+([^\s]+)/gi,
      /ls\s*(?:-[a-z]+)?\s*([^\s]*)/gi,
    ],
    code_generation: [
      /create\s+(?:a\s+)?(?:new\s+)?(?:react\s+)?component\s+(?:called\s+|named\s+)?([^\s]+)/gi,
      /generate\s+(?:a\s+)?(?:function|method)\s+(?:called\s+|named\s+)?([^\s]+)/gi,
      /add\s+(?:a\s+)?(?:new\s+)?(?:class|interface)\s+([^\s]+)/gi,
      /implement\s+([^\s]+)/gi,
    ],
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
      // Extract file operation intents
      intents.push(...this.extractFileOperationIntents(message));

      // Extract terminal command intents
      intents.push(...this.extractTerminalCommandIntents(message));

      // Extract code generation intents
      intents.push(...this.extractCodeGenerationIntents(message));

      // Extract intents from code blocks
      intents.push(...this.extractCodeBlockIntents(message));

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      parseErrors.push(`Parse error: ${errorMessage}`);
    }

    const parseTime = Date.now() - startTime;

    return {
      originalMessage: message,
      intents,
      confidence: this.calculateConfidence(message, intents),
      parseErrors,
      metadata: {
        modelUsed: 'claude-sonnet-4-20250514',
        parseTime,
        intentCount: intents.length,
      },
    };
  }

  /**
   * Extract file operation intents from message
   */
  private static extractFileOperationIntents(message: string): FileOperationIntent[] {
    const intents: FileOperationIntent[] = [];

    // Create file operations
    const createMatches = message.match(/create\s+(?:a\s+)?(?:new\s+)?file\s+(?:called\s+|named\s+)?["`']([^"`']+)["`']/gi);
    if (createMatches) {
      createMatches.forEach(match => {
        const pathMatch = match.match(/["`']([^"`']+)["`']/);
        if (pathMatch) {
          intents.push(this.createFileOperationIntent('create', pathMatch[1]));
        }
      });
    }

    // Update file operations
    const updateMatches = message.match(/update\s+(?:the\s+)?file\s+["`']([^"`']+)["`']/gi);
    if (updateMatches) {
      updateMatches.forEach(match => {
        const pathMatch = match.match(/["`']([^"`']+)["`']/);
        if (pathMatch) {
          intents.push(this.createFileOperationIntent('update', pathMatch[1]));
        }
      });
    }

    return intents;
  }

  /**
   * Extract terminal command intents from message
   */
  private static extractTerminalCommandIntents(message: string): TerminalCommandIntent[] {
    const intents: TerminalCommandIntent[] = [];

    // Command execution patterns
    const commandPatterns = [
      /run\s+(?:the\s+)?command\s+["`']([^"`']+)["`']/gi,
      /execute\s+["`']([^"`']+)["`']/gi,
      /npm\s+(install|run|start|build|test)(?:\s+([^\s]+))?/gi,
    ];

    commandPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(message)) !== null) {
        const command = match[1] || match[0];
        intents.push(this.createTerminalCommandIntent(command));
      }
    });

    return intents;
  }

  /**
   * Extract code generation intents from message
   */
  private static extractCodeGenerationIntents(message: string): CodeGenerationIntent[] {
    const intents: CodeGenerationIntent[] = [];

    // Component creation
    const componentMatches = message.match(/create\s+(?:a\s+)?(?:new\s+)?(?:react\s+)?component\s+(?:called\s+|named\s+)?([^\s]+)/gi);
    if (componentMatches) {
      componentMatches.forEach(match => {
        const nameMatch = match.match(/component\s+(?:called\s+|named\s+)?([^\s]+)/i);
        if (nameMatch) {
          intents.push(this.createCodeGenerationIntent('component', nameMatch[1]));
        }
      });
    }

    // Function generation
    const functionMatches = message.match(/generate\s+(?:a\s+)?(?:function|method)\s+(?:called\s+|named\s+)?([^\s]+)/gi);
    if (functionMatches) {
      functionMatches.forEach(match => {
        const nameMatch = match.match(/(?:function|method)\s+(?:called\s+|named\s+)?([^\s]+)/i);
        if (nameMatch) {
          intents.push(this.createCodeGenerationIntent('function', nameMatch[1]));
        }
      });
    }

    return intents;
  }

  /**
   * Extract intents from code blocks in the message
   */
  private static extractCodeBlockIntents(message: string): Intent[] {
    const intents: Intent[] = [];
    let match;

    while ((match = this.CODE_BLOCK_PATTERN.exec(message)) !== null) {
      const language = match[1] || 'text';
      const code = match[2];

      // Look for file paths in surrounding text
      const beforeBlock = message.substring(0, match.index);
      const filePathMatches = beforeBlock.match(this.FILE_PATH_PATTERN);
      
      if (filePathMatches && filePathMatches.length > 0) {
        const filePath = filePathMatches[filePathMatches.length - 1];
        intents.push(this.createFileOperationIntent('create', filePath, code));
      }
    }

    return intents;
  }

  /**
   * Create a file operation intent
   */
  private static createFileOperationIntent(
    operation: 'create' | 'update' | 'delete' | 'rename' | 'move',
    path: string,
    content?: string
  ): FileOperationIntent {
    return {
      id: nanoid(),
      type: 'file_operation',
      timestamp: new Date(),
      source: 'ai_chat',
      priority: 'medium',
      operation,
      target: {
        path,
        content,
      },
      validation: {
        fileType: this.getFileType(path),
        sizeLimit: 1024 * 1024, // 1MB default limit
        permissions: ['read', 'write'],
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
      timestamp: new Date(),
      source: 'ai_chat',
      priority: this.getCommandPriority(command),
      command,
      workingDirectory: '/projects/default-app',
      timeout: 30000, // 30 seconds default
      validation: {
        allowedCommands: ['npm', 'node', 'ls', 'cd', 'mkdir', 'touch'],
        restrictedPaths: ['/', '/etc', '/usr', '/var'],
        requireConfirmation: this.requiresConfirmation(command),
      },
    };
  }

  /**
   * Create a code generation intent
   */
  private static createCodeGenerationIntent(
    target: 'component' | 'function' | 'class',
    name: string
  ): CodeGenerationIntent {
    return {
      id: nanoid(),
      type: 'code_generation',
      timestamp: new Date(),
      source: 'ai_chat',
      priority: 'medium',
      target: {
        file: this.suggestFilePath(target, name),
        [target]: name,
      },
      requirements: {
        language: 'javascript',
        framework: 'react',
        patterns: ['functional', 'hooks'],
        tests: false,
      },
      context: {
        existingCode: '',
        imports: [],
        dependencies: [],
      },
    };
  }

  /**
   * Calculate confidence score for parsed intents
   */
  private static calculateConfidence(message: string, intents: Intent[]): number {
    if (intents.length === 0) return 0;

    const indicators = [
      /create|generate|add|implement|build/gi,
      /file|component|function|class/gi,
      /```[\s\S]*?```/g,
      /["`'][^"`']*\.[a-z]+["`']/gi, // File paths
    ];

    let score = 0;
    indicators.forEach(pattern => {
      const matches = message.match(pattern);
      if (matches) score += matches.length * 0.2;
    });

    return Math.min(score / intents.length, 1);
  }

  /**
   * Utility methods
   */
  private static getFileType(path: string): string {
    const extension = path.split('.').pop()?.toLowerCase();
    const typeMap: Record<string, string> = {
      'js': 'javascript',
      'jsx': 'javascript-react',
      'ts': 'typescript',
      'tsx': 'typescript-react',
      'css': 'stylesheet',
      'html': 'markup',
      'json': 'data',
      'md': 'markdown',
    };
    return typeMap[extension || ''] || 'text';
  }

  private static getCommandPriority(command: string): 'low' | 'medium' | 'high' | 'critical' {
    if (command.includes('rm ') || command.includes('delete')) return 'critical';
    if (command.includes('npm install') || command.includes('git')) return 'high';
    if (command.includes('npm run') || command.includes('build')) return 'medium';
    return 'low';
  }

  private static requiresConfirmation(command: string): boolean {
    const dangerousCommands = ['rm', 'delete', 'format', 'shutdown', 'reboot'];
    return dangerousCommands.some(cmd => command.includes(cmd));
  }

  private static suggestFilePath(type: string, name: string): string {
    const basePath = '/projects/default-app/src';
    switch (type) {
      case 'component':
        return `${basePath}/components/${name}.jsx`;
      case 'function':
        return `${basePath}/utils/${name}.js`;
      case 'class':
        return `${basePath}/services/${name}.js`;
      default:
        return `${basePath}/${name}.js`;
    }
  }
}