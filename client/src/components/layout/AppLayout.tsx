import React, { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import Sidebar from './Sidebar';
import ChatPage from '@/pages/ChatPage';
import DocumentsPage from '@/pages/DocumentsPage';
import SettingsPage from '@/pages/SettingsPage';
import { useApp } from '@/context/AppContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Menu, Zap, Cpu, Leaf, Flame } from 'lucide-react';

// Theme modes
type ThemeMode = 'default' | 'eco' | 'performance' | 'overdrive';

export default function AppLayout() {
  const [location] = useLocation();
  const { activeView, setActiveView, systemStatus, settings } = useApp();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const [themeMode, setThemeMode] = useState<ThemeMode>('default');
  
  // Apply theme class to body based on settings
  useEffect(() => {
    const body = document.body;
    // Remove all theme classes
    body.classList.remove('eco-mode', 'performance-mode', 'overdrive-mode');
    
    // Apply theme based on settings
    if (settings?.ecoMode) {
      body.classList.add('eco-mode');
      setThemeMode('eco');
    } else if (settings?.gpuAcceleration && settings?.temperatureProfile === 'high') {
      // If GPU acceleration is enabled with high temp profile, use overdrive theme
      body.classList.add('overdrive-mode');
      setThemeMode('overdrive');
    } else if (settings?.gpuAcceleration) {
      // If GPU acceleration is enabled but not eco mode, use performance theme
      body.classList.add('performance-mode');
      setThemeMode('performance');
    } else {
      setThemeMode('default');
    }
  }, [settings]);
  
  // Sync hash navigation with app state
  useEffect(() => {
    const hash = location.startsWith('#') ? location.substring(1) : location.substring(location.lastIndexOf('/') + 1);
    
    if (['chat', 'documents', 'settings'].includes(hash)) {
      setActiveView(hash as 'chat' | 'documents' | 'settings');
    } else if (!hash || hash === '/') {
      // Default to chat view
      setActiveView('chat');
    }
  }, [location, setActiveView]);
  
  // Close sidebar on mobile when changing views
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [activeView, isMobile]);
  
  // Helper function to get theme mode icon with updated colors
  const getThemeModeIcon = () => {
    switch(themeMode) {
      case 'eco':
        return <Leaf size={14} style={{ color: '#10b981' }} />;
      case 'performance':
        return <Zap size={14} style={{ color: '#8b5cf6' }} />;
      case 'overdrive':
        return <Flame size={14} style={{ color: '#dc2626' }} />;
      default:
        return null;
    }
  };
  
  return (
    <div style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }} 
      className="flex h-screen overflow-hidden">
      {/* Mobile sidebar toggle */}
      {isMobile && (
        <Button 
          variant="ghost" 
          size="icon" 
          className="fixed top-3 left-3 z-50" 
          onClick={() => setSidebarOpen(!sidebarOpen)}
          style={{ backgroundColor: 'var(--bg-accent)', color: 'var(--text-primary)' }}
        >
          <Menu className="h-5 w-5" />
        </Button>
      )}
      
      {/* Sidebar with responsive behavior - fixed width but not covering content */}
      <div className={`
        ${isMobile ? 'fixed inset-y-0 left-0 z-40 transition-transform duration-300 transform' : 'w-64 min-w-64 flex-shrink-0'}
        ${isMobile && !sidebarOpen ? '-translate-x-full' : 'translate-x-0'}
      `}>
        <Sidebar />
      </div>
      
      {/* Main content area - with proper left margin to avoid sidebar overlap */}
      <div className="flex-1 flex flex-col overflow-hidden" style={{ backgroundColor: 'var(--bg-primary)' }}>
        {/* System status indicator */}
        {systemStatus && !systemStatus.ollamaRunning && (
          <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.2)', color: 'var(--error-color)' }}
            className="border-b p-2 text-xs text-center">
            Ollama is not running. Some features may be limited.
          </div>
        )}
        
        {/* View container with correct page */}
        <main className="flex-1 overflow-y-auto p-0 md:p-6" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <div className="container mx-auto max-w-7xl">
            {activeView === 'chat' && <ChatPage />}
            {activeView === 'documents' && <DocumentsPage />}
            {activeView === 'settings' && <SettingsPage />}
          </div>
        </main>
        
        {/* Footer with version and system status */}
        <footer 
          style={{ borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}
          className="py-2 px-4 text-xs border-t flex justify-between items-center"
        >
          <div className="flex items-center gap-2">
            <span>DocChat AI v0.1.0</span>
            {getThemeModeIcon()}
            {themeMode !== 'default' && (
              <span className="capitalize">{themeMode} Mode</span>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            {/* Ollama status */}
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full" 
                style={{ backgroundColor: systemStatus?.ollamaRunning ? 'var(--success-color)' : 'var(--error-color)' }}></span>
              <span>Ollama</span>
            </span>
            
            {/* GPU status */}
            {systemStatus && systemStatus.gpuAvailable && (
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: 'var(--info-color)' }}></span>
                GPU: {systemStatus.gpuName ? systemStatus.gpuName.split(' ')[1] || systemStatus.gpuName : 'Available'}
              </span>
            )}
          </div>
        </footer>
      </div>
      
      {/* Mobile sidebar backdrop */}
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 backdrop-blur-sm z-30"
          style={{ backgroundColor: 'rgba(18, 18, 18, 0.7)' }}
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
