import { spawn, ChildProcess } from "child_process";
import * as os from "os";

export interface TerminalSession {
  id: string;
  process: ChildProcess;
  cwd: string;
}

export class TerminalService {
  private sessions: Map<string, TerminalSession> = new Map();

  createSession(sessionId: string, initialCwd?: string): TerminalSession {
    const cwd = initialCwd || process.cwd();
    const shell = os.platform() === "win32" ? "cmd.exe" : "/bin/bash";
    
    const childProcess = spawn(shell, [], {
      cwd,
      env: { ...process.env, TERM: "xterm-256color" },
      stdio: ["pipe", "pipe", "pipe"],
    });

    const session: TerminalSession = {
      id: sessionId,
      process: childProcess,
      cwd,
    };

    this.sessions.set(sessionId, session);
    return session;
  }

  getSession(sessionId: string): TerminalSession | undefined {
    return this.sessions.get(sessionId);
  }

  executeCommand(sessionId: string, command: string): boolean {
    const session = this.getSession(sessionId);
    if (!session || !session.process.stdin) {
      return false;
    }

    try {
      session.process.stdin.write(command + "\n");
      return true;
    } catch (error) {
      console.error(`Failed to execute command in session ${sessionId}:`, error);
      return false;
    }
  }

  killSession(sessionId: string): boolean {
    const session = this.getSession(sessionId);
    if (!session) {
      return false;
    }

    try {
      session.process.kill();
      this.sessions.delete(sessionId);
      return true;
    } catch (error) {
      console.error(`Failed to kill session ${sessionId}:`, error);
      return false;
    }
  }

  getAllSessions(): TerminalSession[] {
    return Array.from(this.sessions.values());
  }
}

export const terminalService = new TerminalService();
