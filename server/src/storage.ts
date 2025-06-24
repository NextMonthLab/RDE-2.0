import { users, files, chatMessages, type User, type InsertUser, type File, type InsertFile, type ChatMessage, type InsertChatMessage } from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // File operations
  getFiles(parentPath?: string): Promise<File[]>;
  getFile(path: string): Promise<File | undefined>;
  createFile(file: InsertFile): Promise<File>;
  updateFile(path: string, updates: Partial<InsertFile>): Promise<File | undefined>;
  deleteFile(path: string): Promise<boolean>;
  
  // Chat operations (stateless - temporary storage)
  getChatMessages(): Promise<ChatMessage[]>;
  addChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  clearChatMessages(): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private files: Map<string, File>;
  private chatMessages: ChatMessage[];
  private currentUserId: number;
  private currentFileId: number;
  private currentChatId: number;

  constructor() {
    this.users = new Map();
    this.files = new Map();
    this.chatMessages = [];
    this.currentUserId = 1;
    this.currentFileId = 1;
    this.currentChatId = 1;
    
    // Initialize with default project structure
    this.initializeDefaultProject();
  }

  private initializeDefaultProject() {
    const defaultFiles: InsertFile[] = [
      {
        name: "projects",
        path: "/projects",
        content: "",
        type: "directory",
        parentPath: null,
      },
      {
        name: "default-app",
        path: "/projects/default-app",
        content: "",
        type: "directory",
        parentPath: "/projects",
      },
      {
        name: "src",
        path: "/projects/default-app/src",
        content: "",
        type: "directory",
        parentPath: "/projects/default-app",
      },
      {
        name: "package.json",
        path: "/projects/default-app/package.json",
        content: JSON.stringify({
          name: "default-app",
          version: "0.0.0",
          type: "module",
          scripts: {
            dev: "vite",
            build: "vite build",
            preview: "vite preview"
          },
          dependencies: {
            react: "^18.2.0",
            "react-dom": "^18.2.0"
          },
          devDependencies: {
            "@types/react": "^18.2.43",
            "@types/react-dom": "^18.2.17",
            "@vitejs/plugin-react": "^4.2.1",
            vite: "^5.0.8"
          }
        }, null, 2),
        type: "file",
        parentPath: "/projects/default-app",
      },
      {
        name: "index.html",
        path: "/projects/default-app/index.html",
        content: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>RDE Default App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>`,
        type: "file",
        parentPath: "/projects/default-app",
      },
      {
        name: "vite.config.js",
        path: "/projects/default-app/vite.config.js",
        content: `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173
  }
})`,
        type: "file",
        parentPath: "/projects/default-app",
      },
      {
        name: "App.jsx",
        path: "/projects/default-app/src/App.jsx",
        content: `import React from 'react'
import './App.css'

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Welcome to RDE v2.0</h1>
        <p>Resident Development Environment</p>
        <button 
          onClick={() => alert('Hello from RDE!')}
          className="btn-primary"
        >
          Test Button
        </button>
      </header>
    </div>
  )
}

export default App`,
        type: "file",
        parentPath: "/projects/default-app/src",
      },
      {
        name: "main.jsx",
        path: "/projects/default-app/src/main.jsx",
        content: `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)`,
        type: "file",
        parentPath: "/projects/default-app/src",
      },
      {
        name: "App.css",
        path: "/projects/default-app/src/App.css",
        content: `.App {
  text-align: center;
}

.App-header {
  background-color: #282c34;
  padding: 40px;
  color: white;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.btn-primary {
  background-color: #007acc;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  margin-top: 20px;
}

.btn-primary:hover {
  background-color: #005a9e;
}`,
        type: "file",
        parentPath: "/projects/default-app/src",
      },
      {
        name: "index.css",
        path: "/projects/default-app/src/index.css",
        content: `body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

code {
  font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New',
    monospace;
}`,
        type: "file",
        parentPath: "/projects/default-app/src",
      },
    ];

    defaultFiles.forEach(file => {
      const fileWithId: File = {
        ...file,
        id: this.currentFileId++,
        createdAt: new Date(),
        updatedAt: new Date(),
        content: file.content || "",
        parentPath: file.parentPath || null,
      };
      this.files.set(file.path, fileWithId);
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getFiles(parentPath?: string): Promise<File[]> {
    return Array.from(this.files.values()).filter(
      file => file.parentPath === (parentPath || null)
    );
  }

  async getFile(path: string): Promise<File | undefined> {
    return this.files.get(path);
  }

  async createFile(file: InsertFile): Promise<File> {
    const fileWithId: File = {
      ...file,
      id: this.currentFileId++,
      createdAt: new Date(),
      updatedAt: new Date(),
      content: file.content || "",
      parentPath: file.parentPath || null,
    };
    this.files.set(file.path, fileWithId);
    return fileWithId;
  }

  async updateFile(path: string, updates: Partial<InsertFile>): Promise<File | undefined> {
    const existingFile = this.files.get(path);
    if (!existingFile) return undefined;

    const updatedFile: File = {
      ...existingFile,
      ...updates,
      updatedAt: new Date(),
    };
    
    // If path changed, update the map key
    if (updates.path && updates.path !== path) {
      this.files.delete(path);
      this.files.set(updates.path, updatedFile);
    } else {
      this.files.set(path, updatedFile);
    }
    
    return updatedFile;
  }

  async deleteFile(path: string): Promise<boolean> {
    return this.files.delete(path);
  }

  async getChatMessages(): Promise<ChatMessage[]> {
    return [...this.chatMessages];
  }

  async addChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const chatMessage: ChatMessage = {
      ...message,
      id: this.currentChatId++,
      timestamp: new Date(),
    };
    this.chatMessages.push(chatMessage);
    return chatMessage;
  }

  async clearChatMessages(): Promise<void> {
    this.chatMessages = [];
  }
}

export const storage = new MemStorage();
