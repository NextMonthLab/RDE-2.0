import fs from 'fs/promises';
import path from 'path';
/**
 * Create required directories for the application
 */
export async function createDirectories() {
    const directories = [
        process.env.PROJECTS_PATH || '/app/projects',
        process.env.AUDIT_LOG_PATH || '/app/system/audit',
        '/app/system',
    ];
    for (const dir of directories) {
        try {
            await fs.mkdir(dir, { recursive: true });
            console.log(`[FileSystem] Created directory: ${dir}`);
        }
        catch (error) {
            console.error(`[FileSystem] Failed to create directory ${dir}:`, error);
        }
    }
}
/**
 * Ensure a directory exists, creating it if necessary
 */
export async function ensureDirectory(dirPath) {
    try {
        await fs.access(dirPath);
    }
    catch {
        await fs.mkdir(dirPath, { recursive: true });
    }
}
/**
 * Check if a path is within the allowed workspace
 */
export function isWithinWorkspace(filePath, workspaceRoot) {
    const normalizedPath = path.normalize(filePath);
    const normalizedWorkspace = path.normalize(workspaceRoot);
    return normalizedPath.startsWith(normalizedWorkspace);
}
/**
 * Resolve a safe file path within the workspace
 */
export function resolveSafePath(filePath, workspaceRoot) {
    // Remove any path traversal attempts
    const safePath = filePath.replace(/\.\./g, '');
    // Resolve relative to workspace root
    const resolvedPath = path.resolve(workspaceRoot, safePath.startsWith('/') ? safePath.slice(1) : safePath);
    // Ensure it's within the workspace
    if (!isWithinWorkspace(resolvedPath, workspaceRoot)) {
        throw new Error(`Path ${filePath} is outside workspace ${workspaceRoot}`);
    }
    return resolvedPath;
}
/**
 * Get file extension from path
 */
export function getFileExtension(filePath) {
    return path.extname(filePath).toLowerCase();
}
/**
 * Check if file extension is allowed
 */
export function isAllowedExtension(filePath, allowedExtensions) {
    const ext = getFileExtension(filePath);
    return allowedExtensions.includes(ext);
}
/**
 * Get file size safely
 */
export async function getFileSize(filePath) {
    try {
        const stats = await fs.stat(filePath);
        return stats.size;
    }
    catch {
        return 0;
    }
}
/**
 * Check if file exists
 */
export async function fileExists(filePath) {
    try {
        await fs.access(filePath);
        return true;
    }
    catch {
        return false;
    }
}
//# sourceMappingURL=filesystem.js.map