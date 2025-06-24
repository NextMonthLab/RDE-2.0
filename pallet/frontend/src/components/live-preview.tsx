import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { ExternalLink, RefreshCw } from 'lucide-react';

interface LivePreviewProps {
  projectPath?: string;
}

const LivePreview: React.FC<LivePreviewProps> = ({ projectPath }) => {
  const [previewUrl, setPreviewUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // In production, this would be the actual preview URL
    const baseUrl = window.location.origin;
    setPreviewUrl(`${baseUrl}/preview`);
  }, [projectPath]);

  const handleRefresh = () => {
    setIsLoading(true);
    // Simulate refresh
    setTimeout(() => setIsLoading(false), 1000);
  };

  const handleOpenExternal = () => {
    if (previewUrl) {
      window.open(previewUrl, '_blank');
    }
  };

  return (
    <div className="w-full h-full rde-bg-primary border-l rde-border flex flex-col">
      {/* Preview Header */}
      <div className="h-10 border-b rde-border flex items-center justify-between px-3">
        <span className="text-sm font-medium rde-text-primary">Live Preview</span>
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
            className="h-6 w-6 p-0"
          >
            <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleOpenExternal}
            className="h-6 w-6 p-0"
          >
            <ExternalLink className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Preview Content */}
      <div className="flex-1 relative">
        {previewUrl ? (
          <iframe
            src={previewUrl}
            className="w-full h-full border-0"
            title="Live Preview"
            sandbox="allow-scripts allow-same-origin allow-forms"
          />
        ) : (
          <div className="flex items-center justify-center h-full rde-text-secondary">
            <div className="text-center">
              <p className="text-sm mb-2">No preview available</p>
              <p className="text-xs">Start your development server to see live preview</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LivePreview;