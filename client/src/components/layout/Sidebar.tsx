import React from 'react';
import { useLocation } from 'wouter';
import { useApp } from '@/context/AppContext';
import { MessageSquare, FileText, Settings, Bot, BookOpen, Terminal, Mic } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  path: string;
  isActive: boolean;
  onClick: () => void;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ icon, label, path, isActive, onClick }) => {
  return (
    <li>
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            <a 
              href={path} 
              className={cn(
                "nav-item",
                isActive && "nav-item-active"
              )}
              onClick={(e) => {
                e.preventDefault();
                onClick();
              }}
              style={{
                color: isActive ? 'var(--primary-color)' : 'var(--sidebar-text)'
              }}
            >
              <span className="mr-3">{icon}</span>
              <span className="hidden md:block">{label}</span>
            </a>
          </TooltipTrigger>
          <TooltipContent side="right" className="md:hidden">
            {label}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </li>
  );
};

export default function Sidebar() {
  const [location, setLocation] = useLocation();
  const { activeView, setActiveView, systemStatus } = useApp();
  
  const handleNavigation = (view: 'chat' | 'documents' | 'settings') => {
    setActiveView(view);
    setLocation(`#${view}`);
  };
  
  return (
    <div className="sidebar w-20 md:w-64 flex flex-col h-full border-r shadow-sm" 
      style={{ 
        backgroundColor: 'var(--sidebar-bg)',
        borderColor: 'var(--border-color)',
        width: '16rem'
      }}>
      {/* App logo */}
      <div className="p-4 flex justify-center md:justify-start items-center border-b h-16"
        style={{ borderColor: 'var(--border-color)' }}>
        <div className="h-10 w-10 rounded-lg flex items-center justify-center md:mr-3"
          style={{ 
            backgroundColor: 'var(--primary-color)', 
            color: '#ffffff' 
          }}>
          <Bot size={20} />
        </div>
        <h1 className="font-semibold text-xl hidden md:block" 
          style={{ color: 'var(--text-accent)' }}>DocChat AI</h1>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 py-6 px-2">
        <div className="text-xs font-medium mb-2 px-3 hidden md:block"
          style={{ color: 'var(--text-muted)' }}>
          Navigation
        </div>
        
        <ul className="space-y-1">
          <SidebarItem 
            icon={<MessageSquare size={18} />} 
            label="Chat" 
            path="#chat" 
            isActive={activeView === 'chat'} 
            onClick={() => handleNavigation('chat')} 
          />
          
          <SidebarItem 
            icon={<FileText size={18} />} 
            label="Documents" 
            path="#documents" 
            isActive={activeView === 'documents'} 
            onClick={() => handleNavigation('documents')} 
          />
          
          <SidebarItem 
            icon={<Settings size={18} />} 
            label="Settings" 
            path="#settings" 
            isActive={activeView === 'settings'} 
            onClick={() => handleNavigation('settings')} 
          />
        </ul>
        
        {/* Advanced features section (will be implemented in future steps) */}
        <div className="mt-8 mb-2">
          <div className="text-xs font-medium mb-2 px-3 hidden md:block"
            style={{ color: 'var(--text-muted)' }}>
            Advanced Features
          </div>
          
          <ul className="space-y-1 opacity-50">
            <li>
              <a className="nav-item"
                style={{ color: 'var(--text-muted)' }}>
                <span className="mr-3"><BookOpen size={18} /></span>
                <span className="hidden md:block">Knowledge Base</span>
              </a>
            </li>
            <li>
              <a className="nav-item" 
                style={{ color: 'var(--text-muted)' }}>
                <span className="mr-3"><Terminal size={18} /></span>
                <span className="hidden md:block">Code Runner</span>
              </a>
            </li>
            <li>
              <a className="nav-item"
                style={{ color: 'var(--text-muted)' }}>
                <span className="mr-3"><Mic size={18} /></span>
                <span className="hidden md:block">Voice Chat</span>
              </a>
            </li>
          </ul>
        </div>
      </nav>
      
      {/* System status indicators */}
      <div className="p-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
        <div className="text-xs font-medium mb-2 hidden md:block"
          style={{ color: 'var(--text-muted)' }}>
          System Status
        </div>
        
        <div className="space-y-2">
          {/* Ollama status */}
          <div className="flex items-center">
            <div className="w-2 h-2 rounded-full mr-2" 
              style={{ 
                backgroundColor: systemStatus?.ollamaRunning 
                  ? 'var(--success-color)' 
                  : 'var(--error-color)' 
              }}></div>
            <span className="text-sm hidden md:block" style={{ color: 'var(--text-secondary)' }}>
              {systemStatus?.ollamaRunning ? 'Ollama Connected' : 'Ollama Offline'}
            </span>
          </div>
          
          {/* GPU status */}
          <div className="flex items-center">
            <div className="w-2 h-2 rounded-full mr-2"
              style={{ 
                backgroundColor: systemStatus?.gpuAvailable 
                  ? 'var(--info-color)' 
                  : 'var(--text-muted)' 
              }}></div>
            <span className="text-sm hidden md:block truncate max-w-[180px]" 
              style={{ color: 'var(--text-secondary)' }}>
              {systemStatus?.gpuAvailable 
                ? `GPU: ${systemStatus?.gpuName ? systemStatus.gpuName.split(' ')[1] || systemStatus.gpuName : 'Available'}` 
                : 'GPU Not Available'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
