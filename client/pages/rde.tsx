import { useState, useEffect } from "react";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import FileExplorer from "@/components/file-explorer";
import MonacoEditor from "@/components/monaco-editor";
import Terminal from "@/components/terminal";
import ChatInterface from "@/components/chat-interface";
import PreviewWindow from "@/components/preview-window";
import MiddlewareStatus from "@/components/middleware-status";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Eye, Layout, FileText, Terminal as TerminalIcon, MessageSquare, Shield } from "lucide-react";

export default function RDEPage() {
  const [selectedFile, setSelectedFile] = useState<string | null>("/projects/default-app/src/App.jsx");
  const [openTabs, setOpenTabs] = useState<string[]>(["/projects/default-app/src/App.jsx"]);
  const [showPreview, setShowPreview] = useState(false);
  const [showMiddleware, setShowMiddleware] = useState(false);

  const handleFileSelect = (filePath: string) => {
    setSelectedFile(filePath);
    if (!openTabs.includes(filePath)) {
      setOpenTabs([...openTabs, filePath]);
    }
  };

  const handleCloseTab = (filePath: string) => {
    const newTabs = openTabs.filter(tab => tab !== filePath);
    setOpenTabs(newTabs);
    
    if (selectedFile === filePath) {
      setSelectedFile(newTabs.length > 0 ? newTabs[newTabs.length - 1] : null);
    }
  };

  return (
    <div className="h-screen flex flex-col rde-bg-primary rde-text-primary">
      {/* Top Menu Bar */}
      <div className="rde-bg-secondary border-b rde-border px-4 py-2 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
              <Layout className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-medium rde-text-primary">RDE v2.0</span>
          </div>
          
          <nav className="hidden md:flex items-center space-x-1 text-sm">
            <Button variant="ghost" size="sm" className="rde-text-primary hover:rde-bg-accent">File</Button>
            <Button variant="ghost" size="sm" className="rde-text-primary hover:rde-bg-accent">Edit</Button>
            <Button variant="ghost" size="sm" className="rde-text-primary hover:rde-bg-accent">View</Button>
            <Button variant="ghost" size="sm" className="rde-text-primary hover:rde-bg-accent">Terminal</Button>
            <Button variant="ghost" size="sm" className="rde-text-primary hover:rde-bg-accent">Help</Button>
          </nav>
        </div>
        
        <div className="flex items-center space-x-4 text-xs rde-text-secondary">
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Connected</span>
          </div>
          <div className="flex items-center space-x-1">
            <Shield className="w-3 h-3 text-blue-400" />
            <span>AI Governance Active</span>
          </div>
          <span>React/Vite Project</span>
          <span>JavaScript</span>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs hover:rde-bg-accent"
            onClick={() => setShowMiddleware(true)}
          >
            Middleware Status
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal">
          {/* File Explorer */}
          <ResizablePanel defaultSize={20} minSize={15} maxSize={35}>
            <FileExplorer onFileSelect={handleFileSelect} />
          </ResizablePanel>
          
          <ResizableHandle className="w-px rde-bg-accent hover:rde-bg-accent transition-colors" />
          
          {/* Center Content */}
          <ResizablePanel defaultSize={60} minSize={30}>
            <ResizablePanelGroup direction="vertical">
              {/* Editor */}
              <ResizablePanel defaultSize={70} minSize={30}>
                <MonacoEditor 
                  selectedFile={selectedFile}
                  openTabs={openTabs}
                  onFileSelect={setSelectedFile}
                  onCloseTab={handleCloseTab}
                />
              </ResizablePanel>
              
              <ResizableHandle className="h-px rde-bg-accent hover:rde-bg-accent transition-colors" />
              
              {/* Terminal */}
              <ResizablePanel defaultSize={30} minSize={20}>
                <Terminal />
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>
          
          <ResizableHandle className="w-px rde-bg-accent hover:rde-bg-accent transition-colors" />
          
          {/* Chat Interface */}
          <ResizablePanel defaultSize={20} minSize={15} maxSize={35}>
            <ChatInterface currentFile={selectedFile} />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* Preview Window */}
      {showPreview && (
        <PreviewWindow onClose={() => setShowPreview(false)} />
      )}

      {/* Middleware Status Window */}
      <MiddlewareStatus 
        isVisible={showMiddleware} 
        onClose={() => setShowMiddleware(false)} 
      />

      {/* Floating Action Buttons - Positioned to not block chat */}
      <div className="fixed bottom-6 right-80 flex flex-col space-y-3 z-40">
        <Button
          onClick={() => setShowMiddleware(!showMiddleware)}
          className="bg-purple-600 hover:bg-purple-700 text-white p-2 rounded-full shadow-lg"
          size="sm"
          title="Middleware Status"
        >
          <Shield className="w-4 h-4" />
        </Button>
        <Button
          onClick={() => setShowPreview(!showPreview)}
          className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full shadow-lg"
          size="sm"
          title="Live Preview"
        >
          <Eye className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
