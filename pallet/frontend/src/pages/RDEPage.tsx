import { useState } from 'react'
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '../components/ui/resizable'
import FileExplorer from '../components/file-explorer'
import CodeEditor from '../components/monaco-editor'
import Terminal from '../components/terminal'
import ChatInterface from '../components/chat-interface'
import LivePreview from '../components/live-preview'
import Header from '../components/header'
import MiddlewareDashboard from '../components/middleware-status'

export default function RDEPage() {
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [showMiddleware, setShowMiddleware] = useState(false)

  return (
    <div className="h-screen flex flex-col">
      <Header 
        onToggleMiddleware={() => setShowMiddleware(!showMiddleware)}
        middlewareActive={showMiddleware}
      />
      
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal">
          {/* File Explorer */}
          <ResizablePanel defaultSize={20} minSize={15}>
            <div className="h-full border-r bg-muted/50">
              <FileExplorer 
                onSelectFile={setSelectedFile}
                selectedFile={selectedFile}
              />
            </div>
          </ResizablePanel>

          <ResizableHandle />

          {/* Main Content Area */}
          <ResizablePanel defaultSize={60}>
            <ResizablePanelGroup direction="vertical">
              {/* Code Editor */}
              <ResizablePanel defaultSize={70}>
                <CodeEditor 
                  selectedFile={selectedFile}
                  onFileChange={() => {/* Handle file changes */}}
                />
              </ResizablePanel>

              <ResizableHandle />

              {/* Terminal */}
              <ResizablePanel defaultSize={30} minSize={20}>
                <Terminal />
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>

          <ResizableHandle />

          {/* Right Sidebar */}
          <ResizablePanel defaultSize={20} minSize={15}>
            <ResizablePanelGroup direction="vertical">
              {/* Chat Interface */}
              <ResizablePanel defaultSize={showMiddleware ? 50 : 70}>
                <ChatInterface />
              </ResizablePanel>

              {showMiddleware && (
                <>
                  <ResizableHandle />
                  {/* Middleware Dashboard */}
                  <ResizablePanel defaultSize={50}>
                    <MiddlewareDashboard />
                  </ResizablePanel>
                </>
              )}

              <ResizableHandle />

              {/* Live Preview */}
              <ResizablePanel defaultSize={showMiddleware ? 0 : 30} minSize={0}>
                <LivePreview />
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  )
}