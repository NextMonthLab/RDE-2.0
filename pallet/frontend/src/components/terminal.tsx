import { useState, useEffect, useRef } from "react";
import { Terminal as TerminalIcon, Trash2, Copy, Maximize, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useWebSocket } from "@/hooks/use-websocket";

interface TerminalLine {
  id: string;
  content: string;
  type: "input" | "output" | "error";
}

export default function Terminal() {
  const [terminalLines, setTerminalLines] = useState<TerminalLine[]>([]);
  const [currentCommand, setCurrentCommand] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isMaximized, setIsMaximized] = useState(false);
  const terminalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { isConnected, sendMessage } = useWebSocket({
    onMessage: (message) => {
      switch (message.type) {
        case "terminal:created":
          setSessionId(message.sessionId);
          addTerminalLine(`Terminal session ${message.sessionId} created`, "output");
          break;
          
        case "terminal:output":
          addTerminalLine(message.data, "output");
          break;
          
        case "terminal:exit":
          addTerminalLine(`Process exited with code ${message.code}`, "error");
          setSessionId(null);
          break;
          
        default:
          break;
      }
    },
    onConnect: () => {
      initializeTerminal();
    },
  });

  const addTerminalLine = (content: string, type: "input" | "output" | "error") => {
    const lines = content.split('\n').map((line, index) => ({
      id: `${Date.now()}-${index}`,
      content: line,
      type,
    }));
    
    setTerminalLines(prev => [...prev, ...lines]);
  };

  const initializeTerminal = () => {
    if (isConnected) {
      sendMessage({
        type: "terminal:create",
        sessionId: `session_${Date.now()}`,
        cwd: "/projects/default-app",
      });
    }
  };

  const executeCommand = (command: string) => {
    if (!command.trim() || !sessionId) return;

    // Add command to terminal display
    addTerminalLine(`$ ${command}`, "input");
    
    // Send command to backend
    sendMessage({
      type: "terminal:input",
      sessionId,
      data: command,
    });

    setCurrentCommand("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      executeCommand(currentCommand);
    }
  };

  const clearTerminal = () => {
    setTerminalLines([]);
  };

  const copyTerminalContent = () => {
    const content = terminalLines.map(line => line.content).join('\n');
    navigator.clipboard.writeText(content);
  };

  // Auto-scroll to bottom when new lines are added
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [terminalLines]);

  // Focus input when terminal is clicked
  const handleTerminalClick = () => {
    inputRef.current?.focus();
  };

  return (
    <div className={`h-full rde-bg-secondary border-t rde-border flex flex-col ${isMaximized ? 'fixed inset-0 z-50' : ''}`}>
      {/* Terminal Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b rde-border">
        <div className="flex items-center space-x-4">
          <h3 className="text-sm font-medium rde-text-primary">TERMINAL</h3>
          <div className="flex items-center space-x-2 text-xs rde-text-secondary">
            <div className="flex items-center space-x-1">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
            </div>
            <span>/projects/default-app</span>
          </div>
        </div>
        <div className="flex items-center space-x-1">
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0 hover:rde-bg-accent"
            onClick={clearTerminal}
            title="Clear Terminal"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0 hover:rde-bg-accent"
            onClick={copyTerminalContent}
            title="Copy Content"
          >
            <Copy className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0 hover:rde-bg-accent"
            onClick={() => setIsMaximized(!isMaximized)}
            title={isMaximized ? "Restore" : "Maximize"}
          >
            {isMaximized ? <X className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Terminal Content */}
      <div 
        ref={terminalRef}
        className="flex-1 overflow-y-auto scrollbar-thin px-4 py-2 font-mono text-sm cursor-text"
        onClick={handleTerminalClick}
      >
        <div className="space-y-1">
          {terminalLines.length === 0 && (
            <div className="rde-text-secondary">
              Welcome to RDE Terminal. Type commands to get started.
            </div>
          )}
          
          {terminalLines.map((line) => (
            <div
              key={line.id}
              className={`whitespace-pre-wrap ${
                line.type === "input" 
                  ? "rde-text-primary font-bold" 
                  : line.type === "error" 
                  ? "text-red-400" 
                  : "rde-text-primary"
              }`}
            >
              {line.content}
            </div>
          ))}
          
          {/* Current command input */}
          <div className="flex items-center space-x-2 rde-text-primary">
            <span className="rde-text-secondary">$</span>
            <Input
              ref={inputRef}
              value={currentCommand}
              onChange={(e) => setCurrentCommand(e.target.value)}
              onKeyDown={handleKeyDown}
              className="border-none bg-transparent p-0 h-auto text-sm font-mono rde-text-primary focus:ring-0 focus:outline-none"
              placeholder="Enter command..."
              disabled={!sessionId}
            />
            <span className="w-2 h-4 bg-white cursor-blink"></span>
          </div>
        </div>
      </div>
    </div>
  );
}
