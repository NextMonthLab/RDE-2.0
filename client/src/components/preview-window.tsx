import { useState, useEffect, useRef } from "react";
import { X, RefreshCw, ExternalLink, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PreviewWindowProps {
  onClose: () => void;
}

export default function PreviewWindow({ onClose }: PreviewWindowProps) {
  const [previewUrl, setPreviewUrl] = useState("http://localhost:5173");
  const [isLoading, setIsLoading] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handleRefresh = () => {
    if (iframeRef.current) {
      setIsLoading(true);
      iframeRef.current.src = iframeRef.current.src;
    }
  };

  const handleOpenInNewTab = () => {
    window.open(previewUrl, "_blank", "noopener,noreferrer");
  };

  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  const handleIframeError = () => {
    setIsLoading(false);
  };

  // Keyboard shortcut to close preview (Escape)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl h-full max-h-[90vh] rde-bg-secondary rounded-lg border rde-border flex flex-col">
        {/* Preview Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b rde-border">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Monitor className="w-5 h-5 text-blue-400" />
              <h3 className="text-sm font-medium rde-text-primary">Live Preview</h3>
            </div>
            <div className="flex items-center space-x-2 text-xs rde-text-secondary">
              <div className={`w-2 h-2 rounded-full ${isLoading ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
              <span>{previewUrl}</span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 hover:rde-bg-accent"
              onClick={handleRefresh}
              title="Refresh Preview"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 hover:rde-bg-accent"
              onClick={handleOpenInNewTab}
              title="Open in New Tab"
            >
              <ExternalLink className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 hover:rde-bg-accent"
              onClick={onClose}
              title="Close Preview (Esc)"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        {/* Preview Content */}
        <div className="flex-1 relative bg-white">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center rde-bg-primary">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <div className="text-sm rde-text-secondary">Loading preview...</div>
              </div>
            </div>
          )}
          
          <iframe
            ref={iframeRef}
            src={previewUrl}
            className="w-full h-full border-0"
            title="Application Preview"
            onLoad={handleIframeLoad}
            onError={handleIframeError}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
          />
        </div>
        
        {/* Preview Status Bar */}
        <div className="px-4 py-2 border-t rde-border rde-bg-accent text-xs rde-text-secondary flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span>React Development Server</span>
            <span>•</span>
            <span>Hot Reload Enabled</span>
          </div>
          <div className="flex items-center space-x-2">
            <span>Press ESC to close</span>
          </div>
        </div>
      </div>
    </div>
  );
}
