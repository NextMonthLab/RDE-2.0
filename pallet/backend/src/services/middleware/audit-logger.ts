/**
 * Audit Logger - Agent Bridge Middleware v2.0
 * Records all AI-generated intents, validation results, and execution outcomes
 */

import fs from 'fs/promises';
import path from 'path';
import { nanoid } from 'nanoid';
import type { Intent, ValidationResult, ExecutionResult, AuditEntry } from './types.js';

export class AuditLogger {
  private static instance: AuditLogger;
  private logPath: string;
  private logBuffer: AuditEntry[] = [];
  private bufferSize = 100;
  private flushInterval = 30000; // 30 seconds
  private retentionDays = 30;

  private constructor(logPath: string = process.env.AUDIT_LOG_PATH || '/app/system/audit') {
    this.logPath = logPath;
    this.startFlushTimer();
    this.ensureLogDirectory();
  }

  public static getInstance(logPath?: string): AuditLogger {
    if (!AuditLogger.instance) {
      AuditLogger.instance = new AuditLogger(logPath);
    }
    return AuditLogger.instance;
  }

  /**
   * Log an audit entry for intent processing
   */
  public async logIntentProcessing(
    intent: Intent,
    validation: ValidationResult,
    execution?: ExecutionResult,
    source?: { sessionId: string; userId?: string; chatMessage?: string }
  ): Promise<void> {
    const entry: AuditEntry = {
      id: nanoid(),
      timestamp: new Date(),
      intent,
      validation,
      source: {
        sessionId: source?.sessionId || 'unknown',
        ...(source?.userId && { userId: source.userId }),
        ...(source?.chatMessage && { chatMessage: source.chatMessage.substring(0, 200) }),
      },
      outcome: this.determineOutcome(validation, execution),
      ...(execution && { execution }),
    };

    await this.addEntry(entry);
  }

  /**
   * Add entry to audit log
   */
  private async addEntry(entry: AuditEntry): Promise<void> {
    this.logBuffer.push(entry);

    if (this.logBuffer.length >= this.bufferSize) {
      await this.flush();
    }
  }

  /**
   * Flush buffer to file
   */
  private async flush(): Promise<void> {
    if (this.logBuffer.length === 0) return;

    try {
      const logFile = path.join(this.logPath, `audit-${new Date().toISOString().split('T')[0]}.log`);
      const entries = this.logBuffer.splice(0);
      const logLines = entries.map(entry => this.formatLogEntry(entry)).join('\n') + '\n';

      await fs.appendFile(logFile, logLines, 'utf8');
      console.log(`[AuditLogger] Flushed ${entries.length} entries to ${logFile}`);
    } catch (error) {
      console.error('[AuditLogger] Failed to flush entries:', error);
      // Put entries back in buffer if flush failed
      this.logBuffer.unshift(...this.logBuffer);
    }
  }

  /**
   * Format log entry as JSON line
   */
  private formatLogEntry(entry: AuditEntry): string {
    return JSON.stringify({
      id: entry.id,
      timestamp: entry.timestamp.toISOString(),
      intentType: entry.intent.type,
      intentId: entry.intent.id,
      validation: {
        isValid: entry.validation.isValid,
        requiresApproval: entry.validation.requiresApproval,
        appliedRules: entry.validation.appliedRules,
        errors: entry.validation.errors,
        warnings: entry.validation.warnings,
      },
      execution: entry.execution ? {
        success: entry.execution.success,
        duration: entry.execution.duration,
        error: entry.execution.error,
      } : undefined,
      outcome: entry.outcome,
      source: entry.source,
    });
  }

  /**
   * Determine outcome based on validation and execution results
   */
  private determineOutcome(validation: ValidationResult, execution?: ExecutionResult): 'processed' | 'rejected' | 'failed' | 'pending_approval' {
    if (!validation.isValid) return 'rejected';
    if (validation.requiresApproval) return 'pending_approval';
    if (execution?.success === false) return 'failed';
    if (execution?.success === true) return 'processed';
    return 'processed';
  }

  /**
   * Get audit statistics
   */
  public async getAuditStatistics(days: number = 7): Promise<{
    totalEntries: number;
    successfulExecutions: number;
    failedExecutions: number;
    rejectedIntents: number;
    pendingApprovals: number;
    topIntentTypes: Array<{ type: string; count: number }>;
    timeRange: { start: Date; end: Date };
  }> {
    // This is a simplified implementation
    // In production, you would parse log files or use a database
    
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    // For now, return sample statistics
    return {
      totalEntries: this.logBuffer.length,
      successfulExecutions: 0,
      failedExecutions: 0,
      rejectedIntents: 0,
      pendingApprovals: 0,
      topIntentTypes: [
        { type: 'file_operation', count: 0 },
        { type: 'code_generation', count: 0 },
      ],
      timeRange: { start: startDate, end: endDate },
    };
  }

  /**
   * Clean up old audit entries
   */
  public async cleanupOldEntries(): Promise<void> {
    try {
      const files = await fs.readdir(this.logPath);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.retentionDays);

      for (const file of files) {
        if (file.startsWith('audit-') && file.endsWith('.log')) {
          const dateStr = file.substring(6, 16); // Extract date from filename
          const fileDate = new Date(dateStr);
          
          if (fileDate < cutoffDate) {
            await fs.unlink(path.join(this.logPath, file));
            console.log(`[AuditLogger] Cleaned up old log file: ${file}`);
          }
        }
      }
    } catch (error) {
      console.error('[AuditLogger] Failed to cleanup old entries:', error);
    }
  }

  /**
   * Start automatic flush timer
   */
  private startFlushTimer(): void {
    setInterval(async () => {
      await this.flush();
    }, this.flushInterval);
  }

  /**
   * Ensure log directory exists
   */
  private async ensureLogDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.logPath, { recursive: true });
    } catch (error) {
      console.error('[AuditLogger] Failed to create log directory:', error);
    }
  }
}