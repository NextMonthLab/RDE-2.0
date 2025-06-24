import React from 'react';
import { Button } from './ui/button';
import { Settings, Cpu } from 'lucide-react';

interface HeaderProps {
  onShowMiddleware?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onShowMiddleware }) => {
  return (
    <header className="h-12 border-b rde-border rde-bg-primary flex items-center justify-between px-4">
      <div className="flex items-center space-x-4">
        <h1 className="text-lg font-semibold rde-text-primary">RDE v2.0</h1>
        <span className="text-sm rde-text-secondary">Resident Development Environment</span>
      </div>
      
      <div className="flex items-center space-x-2">
        {onShowMiddleware && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onShowMiddleware}
            className="text-xs"
          >
            <Cpu className="w-4 h-4 mr-1" />
            Middleware
          </Button>
        )}
        <Button variant="ghost" size="sm">
          <Settings className="w-4 h-4" />
        </Button>
      </div>
    </header>
  );
};

export default Header;