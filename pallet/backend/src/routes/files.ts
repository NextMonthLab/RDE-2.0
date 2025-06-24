/**
 * Files API Routes for RDE v2.0 Hetzner Deployment Pallet
 */

import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { resolveSafePath, isWithinWorkspace, ensureDirectory } from '../utils/filesystem.js';

const router = express.Router();
const workspaceRoot = process.env.PROJECTS_PATH || '/app/projects';

// Get file tree
router.get('/', async (req, res) => {
  try {
    const files = await getFileTree(workspaceRoot);
    res.json(files);
  } catch (error) {
    console.error('[Files] Error getting file tree:', error);
    res.status(500).json({ error: 'Failed to get file tree' });
  }
});

// Get file content
router.get('*', async (req, res) => {
  try {
    const filePath = (req.params as any)['0'];
    const safePath = resolveSafePath(filePath, workspaceRoot);
    
    const stats = await fs.stat(safePath);
    
    if (stats.isDirectory()) {
      const files = await getFileTree(safePath);
      res.json(files);
    } else {
      const content = await fs.readFile(safePath, 'utf8');
      res.json({
        name: path.basename(safePath),
        path: filePath,
        content,
        type: 'file',
        size: stats.size,
        modified: stats.mtime,
      });
    }
  } catch (error) {
    console.error('[Files] Error getting file:', error);
    res.status(404).json({ error: 'File not found' });
  }
});

// Create or update file
router.post('*', async (req, res) => {
  try {
    const filePath = (req.params as any)['0'];
    const { content } = req.body;
    const safePath = resolveSafePath(filePath, workspaceRoot);
    
    // Ensure parent directory exists
    await ensureDirectory(path.dirname(safePath));
    
    // Write file
    await fs.writeFile(safePath, content || '', 'utf8');
    
    res.json({
      name: path.basename(safePath),
      path: filePath,
      type: 'file',
      message: 'File saved successfully',
    });
  } catch (error) {
    console.error('[Files] Error saving file:', error);
    res.status(500).json({ error: 'Failed to save file' });
  }
});

// Delete file
router.delete('*', async (req, res) => {
  try {
    const filePath = (req.params as any)['0'];
    const safePath = resolveSafePath(filePath, workspaceRoot);
    
    const stats = await fs.stat(safePath);
    
    if (stats.isDirectory()) {
      await fs.rmdir(safePath, { recursive: true });
    } else {
      await fs.unlink(safePath);
    }
    
    res.json({
      path: filePath,
      message: 'File deleted successfully',
    });
  } catch (error) {
    console.error('[Files] Error deleting file:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

async function getFileTree(dirPath: string): Promise<any[]> {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    const files = [];
    
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      const relativePath = path.relative(workspaceRoot, fullPath);
      
      if (entry.isDirectory()) {
        files.push({
          name: entry.name,
          path: `/${relativePath}`,
          type: 'directory',
          children: await getFileTree(fullPath),
        });
      } else {
        const stats = await fs.stat(fullPath);
        files.push({
          name: entry.name,
          path: `/${relativePath}`,
          type: 'file',
          size: stats.size,
          modified: stats.mtime,
        });
      }
    }
    
    return files.sort((a, b) => {
      if (a.type === 'directory' && b.type === 'file') return -1;
      if (a.type === 'file' && b.type === 'directory') return 1;
      return a.name.localeCompare(b.name);
    });
  } catch (error) {
    console.error('[Files] Error reading directory:', dirPath, error);
    return [];
  }
}

export default router;