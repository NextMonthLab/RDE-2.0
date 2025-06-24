/**
 * Intent Parser - Agent Bridge Middleware v2.0
 * Extracts structured intents from AI chat outputs
 */
import type { ParsedChatOutput } from './types.js';
export declare class IntentParser {
    private static readonly INTENT_PATTERNS;
    private static readonly CODE_BLOCK_PATTERN;
    private static readonly FILE_PATH_PATTERN;
    /**
     * Parse AI chat message and extract structured intents
     */
    static parseChatMessage(message: string, sessionId: string): ParsedChatOutput;
    /**
     * Extract file operation intents from message
     */
    private static extractFileOperationIntents;
    /**
     * Extract terminal command intents from message
     */
    private static extractTerminalCommandIntents;
    /**
     * Extract code generation intents from message
     */
    private static extractCodeGenerationIntents;
    /**
     * Extract intents from code blocks in the message
     */
    private static extractCodeBlockIntents;
    /**
     * Create a file operation intent
     */
    private static createFileOperationIntent;
    /**
     * Create a terminal command intent
     */
    private static createTerminalCommandIntent;
    /**
     * Create a code generation intent
     */
    private static createCodeGenerationIntent;
    /**
     * Calculate confidence score for parsed intents
     */
    private static calculateConfidence;
    /**
     * Utility methods
     */
    private static getFileType;
    private static getCommandPriority;
    private static requiresConfirmation;
    private static suggestFilePath;
}
//# sourceMappingURL=intent-parser.d.ts.map