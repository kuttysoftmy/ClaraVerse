import React from 'react';
import { Bell, Sun, Moon, RotateCw } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import UserProfileButton from './common/UserProfileButton';

interface TopbarProps {
  userName?: string;
  onPageChange?: (page: string) => void;
  activePage?: string;
}

const Topbar = ({ userName, onPageChange, activePage }: TopbarProps) => {
  const { isDark, toggleTheme } = useTheme();

  const handleReload = () => {
    if (activePage === 'n8n') {
      window.location.reload();
    }
  };

  return (
    <div className="glassmorphic h-16 px-6 flex items-center justify-between">
      <div className="flex-1">
        {/* Search input removed */}
      </div>
      
      <div className="flex items-center gap-4">
        {activePage === 'n8n' && (
          <button
            onClick={handleReload}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-sakura-500 text-white hover:bg-sakura-600 transition-colors"
            title="Reload N8N Interface"
          >
            <RotateCw className="w-4 h-4" />
            <span className="text-sm font-medium">Reload N8N</span>
          </button>
        )}
        <button 
          onClick={toggleTheme}
          className="p-2 rounded-lg hover:bg-sakura-50 dark:hover:bg-sakura-100/10 transition-colors"
          aria-label="Toggle theme"
        >
          {isDark ? (
            <Sun className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          ) : (
            <Moon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          )}
        </button>
        <button className="p-2 rounded-lg hover:bg-sakura-50 dark:hover:bg-sakura-100/10 transition-colors">
          <Bell className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        </button>
        <UserProfileButton
          userName={userName || 'Profile'}
          onPageChange={onPageChange || (() => {})}
        />
      </div>
    </div>
  );
};

export default Topbar;