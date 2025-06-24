import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as monaco from "monaco-editor";
import { X, Save, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { configureMonaco, getLanguageFromFileName } from "@/lib/monaco-config";
import { apiRequest } from "@/lib/queryClient";
import type { File } from "../shared/schema";

interface MonacoEditorProps {
  selectedFile: string | null;
  openTabs: string[];
  onFileSelect: (filePath: string) => void;
  onCloseTab: (filePath: string) => void;
}

export default function MonacoEditor({ selectedFile, openTabs, onFileSelect, onCloseTab }: MonacoEditorProps) {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMonacoLoaded, setIsMonacoLoaded] = useState(false);
  const [editorContent, setEditorContent] = useState<Record<string, string>>({});
  const [unsavedChanges, setUnsavedChanges] = useState<Set<string>>(new Set());
  
  const queryClient = useQueryClient();

  // Load file content
  const { data: fileData } = useQuery({
    queryKey: [`/api/files${selectedFile}`],
    enabled: !!selectedFile,
    staleTime: 0,
  });

  // Save file mutation
  const saveFileMutation = useMutation({
    mutationFn: async ({ filePath, content }: { filePath: string; content: string }) => {
      return await apiRequest("PUT", `/api/files${filePath.startsWith("/") ? filePath.slice(1) : filePath}`, { content });
    },
    onSuccess: (_, { filePath }) => {
      setUnsavedChanges(prev => {
        const newSet = new Set(prev);
        newSet.delete(filePath);
        return newSet;
      });
      queryClient.invalidateQueries({ queryKey: [`/api/files${filePath}`] });
    },
  });

  // Initialize Monaco Editor
  useEffect(() => {
    const initMonaco = async () => {
      // Configure Monaco
      configureMonaco();
      setIsMonacoLoaded(true);
    };

    initMonaco();
  }, []);

  // Create/update editor when Monaco is loaded and container is ready
  useEffect(() => {
    if (!isMonacoLoaded || !containerRef.current || !selectedFile) return;

    const createEditor = () => {
      if (editorRef.current) {
        editorRef.current.dispose();
      }

      const content = editorContent[selectedFile] || (fileData as any)?.content || "";
      const language = getLanguageFromFileName(selectedFile);

      editorRef.current = monaco.editor.create(containerRef.current!, {
        value: content,
        language,
        theme: "rde-dark",
        automaticLayout: true,
        fontSize: 14,
        lineNumbers: "on",
        wordWrap: "on",
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        renderWhitespace: "selection",
        tabSize: 2,
        insertSpaces: true,
        detectIndentation: true,
        folding: true,
        glyphMargin: true,
        lineDecorationsWidth: 10,
        lineNumbersMinChars: 3,
        renderLineHighlight: "line",
        selectionClipboard: false,
        contextmenu: true,
        mouseWheelZoom: true,
        multiCursorModifier: "ctrlCmd",
        accessibilitySupport: "auto",
      });

      // Handle content changes
      editorRef.current.onDidChangeModelContent(() => {
        if (editorRef.current && selectedFile) {
          const currentContent = editorRef.current.getValue();
          setEditorContent(prev => ({
            ...prev,
            [selectedFile]: currentContent,
          }));
          
          // Mark file as having unsaved changes
          if (currentContent !== (fileData as any)?.content) {
            setUnsavedChanges(prev => new Set(prev).add(selectedFile));
          } else {
            setUnsavedChanges(prev => {
              const newSet = new Set(prev);
              newSet.delete(selectedFile);
              return newSet;
            });
          }
        }
      });

      // Auto-save on Ctrl+S
      editorRef.current.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
        handleSaveFile();
      });
    };

    createEditor();

    return () => {
      if (editorRef.current) {
        editorRef.current.dispose();
      }
    };
  }, [isMonacoLoaded, selectedFile, (fileData as any)?.content]);

  // Update editor content when file data changes
  useEffect(() => {
    if (editorRef.current && fileData && selectedFile) {
      const currentContent = editorRef.current.getValue();
      if (currentContent !== (fileData as any).content && !editorContent[selectedFile]) {
        editorRef.current.setValue((fileData as any).content);
        setEditorContent(prev => ({
          ...prev,
          [selectedFile]: (fileData as any).content,
        }));
      }
    }
  }, [fileData, selectedFile]);

  const handleSaveFile = () => {
    if (!selectedFile || !editorRef.current) return;
    
    const content = editorRef.current.getValue();
    saveFileMutation.mutate({ filePath: selectedFile, content });
  };

  const getFileName = (path: string) => {
    return path.split("/").pop() || path;
  };

  const getBreadcrumbPath = (path: string) => {
    const parts = path.split("/").filter(Boolean);
    return parts.join(" / ");
  };

  if (!isMonacoLoaded) {
    return (
      <div className="w-full h-full rde-bg-primary flex items-center justify-center">
        <div className="text-sm rde-text-secondary">Loading editor...</div>
      </div>
    );
  }

  return (
    <div className="w-full h-full rde-bg-primary flex flex-col">
      {/* Tab Bar */}
      <div className="rde-bg-secondary border-b rde-border flex items-center overflow-x-auto scrollbar-thin">
        {openTabs.map((tabPath) => {
          const isActive = tabPath === selectedFile;
          const hasUnsavedChanges = unsavedChanges.has(tabPath);
          
          return (
            <div
              key={tabPath}
              className={`flex items-center space-x-2 px-4 py-2 border-r rde-border min-w-max cursor-pointer group transition-colors ${
                isActive ? "rde-bg-primary border-b-2 border-blue-400" : "hover:rde-bg-accent"
              }`}
              onClick={() => onFileSelect(tabPath)}
            >
              <span className="text-sm">{getFileName(tabPath)}</span>
              {hasUnsavedChanges && <span className="text-xs rde-text-secondary">●</span>}
              <Button
                size="sm"
                variant="ghost"
                className="opacity-0 group-hover:opacity-100 h-4 w-4 p-0 hover:rde-bg-accent transition-all"
                onClick={(e) => {
                  e.stopPropagation();
                  onCloseTab(tabPath);
                }}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          );
        })}
        
        {/* Tab Actions */}
        <div className="ml-auto flex items-center px-2">
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0 hover:rde-bg-accent"
            onClick={handleSaveFile}
            disabled={!selectedFile || !unsavedChanges.has(selectedFile)}
            title="Save File (Ctrl+S)"
          >
            <Save className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {selectedFile ? (
        <>
          {/* Breadcrumb */}
          <div className="rde-bg-secondary bg-opacity-95 px-4 py-2 border-b rde-border text-xs rde-text-secondary flex items-center justify-between">
            <span>{getBreadcrumbPath(selectedFile)}</span>
            <div className="flex items-center space-x-2">
              <span>{getLanguageFromFileName(selectedFile)}</span>
              <span>•</span>
              <span>UTF-8</span>
              <span>•</span>
              <span>LF</span>
              {unsavedChanges.has(selectedFile) && (
                <>
                  <span>•</span>
                  <span className="rde-text-primary">Unsaved</span>
                </>
              )}
            </div>
          </div>

          {/* Monaco Editor Container */}
          <div ref={containerRef} className="flex-1 overflow-hidden" />

          {/* Editor Status Bar */}
          <div className="rde-bg-accent px-4 py-1 text-xs rde-text-secondary flex items-center justify-between border-t rde-border">
            <div className="flex items-center space-x-4">
              <span>JavaScript React</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Auto Save</span>
              </div>
              <span>UTF-8</span>
            </div>
          </div>
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center rde-bg-primary">
          <div className="text-center">
            <h3 className="text-lg font-medium rde-text-primary mb-2">Welcome to RDE v2.0</h3>
            <p className="text-sm rde-text-secondary">Select a file from the explorer to start editing</p>
          </div>
        </div>
      )}
    </div>
  );
}
