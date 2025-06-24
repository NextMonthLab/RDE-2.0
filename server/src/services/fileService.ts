import { storage } from "../storage";
import * as fs from "fs/promises";
import * as path from "path";

export class FileService {
  private projectsPath = path.join(process.cwd(), "projects");

  async initializeProjectsDirectory() {
    try {
      await fs.access(this.projectsPath);
    } catch {
      await fs.mkdir(this.projectsPath, { recursive: true });
    }
  }

  async syncFileToFileSystem(filePath: string, content: string) {
    const fullPath = path.join(process.cwd(), filePath.startsWith("/") ? filePath.slice(1) : filePath);
    const dirPath = path.dirname(fullPath);
    
    try {
      await fs.mkdir(dirPath, { recursive: true });
      await fs.writeFile(fullPath, content, "utf-8");
    } catch (error) {
      console.error(`Failed to sync file ${filePath}:`, error);
      throw error;
    }
  }

  async readFileFromFileSystem(filePath: string): Promise<string> {
    const fullPath = path.join(process.cwd(), filePath.startsWith("/") ? filePath.slice(1) : filePath);
    
    try {
      return await fs.readFile(fullPath, "utf-8");
    } catch (error) {
      console.error(`Failed to read file ${filePath}:`, error);
      throw error;
    }
  }

  async deleteFileFromFileSystem(filePath: string) {
    const fullPath = path.join(process.cwd(), filePath.startsWith("/") ? filePath.slice(1) : filePath);
    
    try {
      const stat = await fs.stat(fullPath);
      if (stat.isDirectory()) {
        await fs.rmdir(fullPath, { recursive: true });
      } else {
        await fs.unlink(fullPath);
      }
    } catch (error) {
      console.error(`Failed to delete file ${filePath}:`, error);
      throw error;
    }
  }

  async createFileInStorage(name: string, path: string, content: string, type: "file" | "directory", parentPath?: string) {
    const file = await storage.createFile({
      name,
      path,
      content,
      type,
      parentPath: parentPath || null,
    });

    if (type === "file") {
      await this.syncFileToFileSystem(path, content);
    } else {
      await fs.mkdir(path.startsWith("/") ? path.slice(1) : path, { recursive: true });
    }

    return file;
  }

  async updateFileInStorage(filePath: string, updates: { content?: string; name?: string }) {
    const file = await storage.updateFile(filePath, updates);
    
    if (file && updates.content !== undefined) {
      await this.syncFileToFileSystem(filePath, updates.content);
    }

    return file;
  }

  async deleteFileInStorage(filePath: string) {
    const success = await storage.deleteFile(filePath);
    
    if (success) {
      await this.deleteFileFromFileSystem(filePath);
    }

    return success;
  }
}

export const fileService = new FileService();
