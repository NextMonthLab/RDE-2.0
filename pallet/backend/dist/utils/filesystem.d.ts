/**
 * Create required directories for the application
 */
export declare function createDirectories(): Promise<void>;
/**
 * Ensure a directory exists, creating it if necessary
 */
export declare function ensureDirectory(dirPath: string): Promise<void>;
/**
 * Check if a path is within the allowed workspace
 */
export declare function isWithinWorkspace(filePath: string, workspaceRoot: string): boolean;
/**
 * Resolve a safe file path within the workspace
 */
export declare function resolveSafePath(filePath: string, workspaceRoot: string): string;
/**
 * Get file extension from path
 */
export declare function getFileExtension(filePath: string): string;
/**
 * Check if file extension is allowed
 */
export declare function isAllowedExtension(filePath: string, allowedExtensions: string[]): boolean;
/**
 * Get file size safely
 */
export declare function getFileSize(filePath: string): Promise<number>;
/**
 * Check if file exists
 */
export declare function fileExists(filePath: string): Promise<boolean>;
//# sourceMappingURL=filesystem.d.ts.map