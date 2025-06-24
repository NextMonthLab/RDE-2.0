/**
 * Audit Logger - Agent Bridge Middleware v2.0
 * Records all AI-generated intents, validation results, and execution outcomes
 */

import { Intent, ValidationResult, ExecutionResult, AuditEntry } from './types';
import * as fs from 'fs/promises';
import * as path from 'path';

export class AuditLogger {
  private static instance: AuditLogger;
  private logPath: string;
  private logBuffer: AuditEntry[] = [];
  private bufferSize = 100;
  private flushInterval = 30000; // 30 seconds
  private retentionDays = 30;

  private constructor(logPath: string = './system/audit.log') {
    this.logPath = logPath;
    this.startFlushTimer();
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
    source?: {
      chatMessage?: string;
      userId?: string;
      sessionId: string;
    }
  ): Promise<void> {
    const entry: AuditEntry = {
      id: this.generateId(),
      timestamp: new Date(),
      intent,
      validation,
      execution,
      source: source || { sessionId: 'unknown' },
      outcome: this.determineOutcome(validation, execution),
    };

    await this.addEntry(entry);
  }

  /**
   * Add entry to audit log
   */
  private async addEntry(entry: AuditEntry): Promise<void> {
    this.logBuffer.push(entry);

    // Flush if buffer is full
    if (this.logBuffer.length >= this.bufferSize) {
      await this.flush();
    }
  }

  /**
   * Flush buffer to file
   */
  private async flush(): Promise<void> {
    if (this.logBuffer.length === 0) {
      return;
    }

    const entries = [...this.logBuffer];
    this.logBuffer = [];

    try {
      await this.ensureLogDirectory();
      
      const logData = entries.map(entry => this.formatLogEntry(entry)).join('\n') + '\n';
      await fs.appendFile(this.logPath, logData, 'utf-8');
      
      console.log(`[AuditLogger] Flushed ${entries.length} entries to audit log`);
    } catch (error) {
      console.error('[AuditLogger] Failed to flush audit log:', error);
      // Put entries back in buffer on failure
      this.logBuffer.unshift(...entries);
    }
  }

  /**
   * Format log entry as JSON line
   */
  private formatLogEntry(entry: AuditEntry): string {
    return JSON.stringify({
      id: entry.id,
      timestamp: entry.timestamp.toISOString(),
      intent: {
        id: entry.intent.id,
        type: entry.intent.type,
        priority: entry.intent.priority,
        source: entry.intent.source,
      },
      validation: {
        isValid: entry.validation.isValid,
        appliedRules: entry.validation.appliedRules,
        errors: entry.validation.errors,
        warnings: entry.validation.warnings,
        requiresApproval: entry.validation.requiresApproval,
      },
      execution: entry.execution ? {
        success: entry.execution.success,
        duration: entry.execution.duration,
        affectedFiles: entry.execution.affectedFiles,
        error: entry.execution.error,
      } : null,
      source: entry.source,
      outcome: entry.outcome,
    });
  }

  /**
   * Determine outcome based on validation and execution results
   */
  private determineOutcome(validation: ValidationResult, execution?: ExecutionResult): 'processed' | 'rejected' | 'failed' | 'pending_approval' {
    if (!validation.isValid) {
      return 'rejected';
    }
    
    if (validation.requiresApproval) {
      return 'pending_approval';
    }
    
    if (execution) {
      return execution.success ? 'processed' : 'failed';
    }
    
    return 'processed';
  }

  /**
   * Query audit log entries
   */
  public async queryAuditLog(options: {
    startDate?: Date;
    endDate?: Date;
    intentTypes?: string[];
    outcomes?: string[];
    limit?: number;
  } = {}): Promise<AuditEntry[]> {
    try {
      await this.flush(); // Ensure latest entries are written
      
      const logContent = await fs.readFile(this.logPath, 'utf-8');
      const lines = logContent.split('\n').filter(line => line.trim());
      
      let entries = lines.map(line => {
        try {
          const data = JSON.parse(line);
          return this.reconstructAuditEntry(data);
        } catch {
          return null;
        }
      }).filter(entry => entry !== null) as AuditEntry[];

      // Apply filters
      if (options.startDate) {
        entries = entries.filter(entry => entry.timestamp >= options.startDate!);
      }
      
      if (options.endDate) {
        entries = entries.filter(entry => entry.timestamp <= options.endDate!);
      }
      
      if (options.intentTypes?.length) {
        entries = entries.filter(entry => 
          options.intentTypes!.includes(entry.intent.type)
        );
      }
      
      if (options.outcomes?.length) {
        entries = entries.filter(entry => 
          options.outcomes!.includes(entry.outcome)
        );
      }

      // Sort by timestamp (newest first)
      entries.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      // Apply limit
      if (options.limit) {
        entries = entries.slice(0, options.limit);
      }

      return entries;
    } catch (error) {
      console.error('[AuditLogger] Failed to query audit log:', error);
      return [];
    }
  }

  /**
   * Reconstruct audit entry from JSON data
   */
  private reconstructAuditEntry(data: any): AuditEntry {
    return {
      id: data.id,
      timestamp: new Date(data.timestamp),
      intent: data.intent as Intent,
      validation: data.validation as ValidationResult,
      execution: data.execution as ExecutionResult,
      source: data.source,
      outcome: data.outcome,
    };
  }

  /**
   * Get audit statistics
   */
  public async getAuditStatistics(days: number = 7): Promise<{
    totalIntents: number;
    successfulExecutions: number;
    failedExecutions: number;
    rejectedIntents: number;
    pendingApprovals: number;
    intentTypeBreakdown: Record<string, number>;
    ruleViolations: Record<string, number>;
  }> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const entries = await this.queryAuditLog({ startDate });
    
    const stats = {
      totalIntents: entries.length,
      successfulExecutions: 0,
      failedExecutions: 0,
      rejectedIntents: 0,
      pendingApprovals: 0,
      intentTypeBreakdown: {} as Record<string, number>,
      ruleViolations: {} as Record<string, number>,
    };

    entries.forEach(entry => {
      // Count outcomes
      switch (entry.outcome) {
        case 'processed':
          if (entry.execution?.success) {
            stats.successfulExecutions++;
          } else {
            stats.failedExecutions++;
          }
          break;
        case 'rejected':
          stats.rejectedIntents++;
          break;
        case 'pending_approval':
          stats.pendingApprovals++;
          break;
      }

      // Count intent types
      const intentType = entry.intent.type;
      stats.intentTypeBreakdown[intentType] = 
        (stats.intentTypeBreakdown[intentType] || 0) + 1;

      // Count rule violations
      if (entry.validation.errors.length > 0) {
        entry.validation.appliedRules.forEach(ruleId => {
          stats.ruleViolations[ruleId] = 
            (stats.ruleViolations[ruleId] || 0) + 1;
        });
      }
    });

    return stats;
  }

  /**
   * Clean up old audit entries
   */
  public async cleanupOldEntries(): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.retentionDays);
      
      const entries = await this.queryAuditLog();
      const recentEntries = entries.filter(entry => entry.timestamp >= cutoffDate);
      
      if (recentEntries.length < entries.length) {
        // Rewrite log file with only recent entries
        const logData = recentEntries
          .map(entry => this.formatLogEntry(entry))
          .join('\n') + '\n';
        
        await fs.writeFile(this.logPath, logData, 'utf-8');
        
        const removedCount = entries.length - recentEntries.length;
        console.log(`[AuditLogger] Cleaned up ${removedCount} old audit entries`);
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
    const logDir = path.dirname(this.logPath);
    try {
      await fs.mkdir(logDir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }
  }

  /**
   * Generate unique ID for audit entries
   */
  private generateId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Export audit log for external analysis
   */
  public async exportAuditLog(
    outputPath: string,
    options: {
      format: 'json' | 'csv';
      startDate?: Date;
      endDate?: Date;
    }
  ): Promise<void> {
    const entries = await this.queryAuditLog({
      startDate: options.startDate,
      endDate: options.endDate,
    });

    let exportData: string;

    if (options.format === 'csv') {
      const headers = [
        'Timestamp',
        'Intent ID',
        'Intent Type',
        'Priority',
        'Source',
        'Validation Valid',
        'Execution Success',
        'Outcome',
        'Errors',
        'Duration',
      ];
      
      const rows = entries.map(entry => [
        entry.timestamp.toISOString(),
        entry.intent.id,
        entry.intent.type,
        entry.intent.priority,
        entry.intent.source,
        entry.validation.isValid,
        entry.execution?.success || 'N/A',
        entry.outcome,
        entry.validation.errors.join('; '),
        entry.execution?.duration || 'N/A',
      ]);

      exportData = [headers, ...rows].map(row => 
        row.map(cell => `"${cell}"`).join(',')
      ).join('\n');
    } else {
      exportData = JSON.stringify(entries, null, 2);
    }

    await fs.writeFile(outputPath, exportData, 'utf-8');
    console.log(`[AuditLogger] Exported ${entries.length} entries to ${outputPath}`);
  }
}