import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { useTTS } from '@/hooks/useTTS';
import { Message } from '@/types';
import { FileText, Trash2, Bot, User, Volume2, SendHorizontal, AlertCircle, Loader2, Info } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { FadeIn, SlideIn, ScaleIn, StaggeredChildren, GlowEffect } from '@/components/ui/animation';
import { GlassCard, GlassPanel } from '@/components/ui/GlassCard';
import { NeumorphicButton } from '@/components/ui/NeumorphicButton';

export default function ChatPage() {
  const { messages, sendMessage, clearChat, selectedDocuments, settings } = useApp();
  const [messageInput, setMessageInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hardDocumentMode, setHardDocumentMode] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Text-to-speech
  const tts = useTTS({
    enabled: settings?.ttsEnabled || false,
    voice: settings?.ttsVoice || 'alloy',
    rate: parseFloat(settings?.ttsSpeechRate || '1.0'),
  });
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!messageInput.trim() || isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      await sendMessage(messageInput);
      setMessageInput('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle TTS playback
  const handlePlayTTS = (content: string) => {
    tts.speak(content);
  };
  
  // Format content with markdown-like rendering
  const formatContent = (content: string) => {
    // Simple replacement for lists
    const withLists = content.replace(/^- (.+)$/gm, '<li>$1</li>');
    
    // Split by newlines and wrap in paragraphs
    const lines = withLists.split('\n');
    const formatted = lines.map(line => {
      if (line.startsWith('<li>')) {
        return line;
      }
      return line.trim() ? `<p>${line}</p>` : '';
    }).join('');
    
    // Wrap lists in ul tags
    const withUl = formatted.replace(/<li>(.+)<\/li>(\s*<li>(.+)<\/li>)+/g, '<ul>$&</ul>');
    
    // Add CSS with color variables to the HTML
    const styledHtml = `<div style="color: var(--text-primary);">${withUl}</div>`;
    
    return styledHtml;
  };
  
  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header with documents indicator */}
      <header style={{ 
        backgroundColor: 'var(--bg-tertiary)', 
        borderColor: 'var(--border-color)' 
      }} className="p-4 border-b flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div className="flex items-center">
          <h2 style={{ color: 'var(--text-accent)' }} className="font-medium text-xl mr-4">Chat</h2>
          
          {/* Hard document mode toggle */}
          <div className="flex items-center">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="hard-document-mode"
                      checked={hardDocumentMode}
                      onCheckedChange={setHardDocumentMode}
                      style={{ 
                        backgroundColor: hardDocumentMode ? 'var(--primary-color)' : 'var(--toggle-bg-off)' 
                      }}
                    />
                    <Label htmlFor="hard-document-mode" 
                      style={{ color: 'var(--text-secondary)' }}
                      className="text-xs">
                      Document Focus
                    </Label>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Restricts AI responses to information found only in attached documents</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        
        <div className="flex items-center justify-between w-full md:w-auto">
          {/* Document badges */}
          {selectedDocuments.length > 0 && (
            <div className="flex flex-wrap gap-2 max-w-md">
              {selectedDocuments.map((doc, index) => (
                <SlideIn key={doc.id} direction="left" delay={index * 0.1} duration={0.3}>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div style={{ 
                          backgroundColor: 'var(--sidebar-highlight)', 
                          color: 'var(--primary-color)',
                          borderColor: 'var(--primary-color)'
                        }} className="inline-flex items-center px-2 py-1 rounded-full text-xs border border-opacity-20">
                          <FileText size={12} className="mr-1" />
                          <span className="truncate max-w-[100px]">{doc.filename}</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>This document is being used for context</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </SlideIn>
              ))}
            </div>
          )}
          
          {/* Clear chat button */}
          <NeumorphicButton
            variant="danger" 
            size="sm"
            className="ml-2"
            onClick={() => clearChat()}
          >
            <Trash2 size={16} />
          </NeumorphicButton>
        </div>
      </header>
      
      {/* Chat messages container */}
      <div style={{ backgroundColor: 'var(--bg-secondary)' }} className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        {messages.length === 0 ? (
          // Welcome message when no messages
          <ScaleIn duration={0.5}>
            <div className="flex items-start max-w-3xl mx-auto">
              <div style={{ backgroundColor: 'var(--primary-color)' }} className="w-8 h-8 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                <Bot size={16} color="white" />
              </div>
              <GlassCard variant="secondary" className="max-w-[80%]">
                <p style={{ color: 'var(--text-primary)' }}>
                  Hello! I'm DocChat AI, powered by Ollama. I can help answer questions about your documents. 
                  {selectedDocuments.length === 0 && " Please select some documents first to get started."}
                </p>
                {settings?.selectedModel && (
                  <div className="mt-2 text-xs flex items-center" style={{ color: 'var(--text-muted)' }}>
                    <Info size={12} className="mr-1" />
                    <span>Using model: {settings.selectedModel}</span>
                  </div>
                )}
              </GlassCard>
            </div>
          </ScaleIn>
        ) : (
          // Render messages
          <StaggeredChildren staggerDelay={0.1}>
            {messages.map((message: Message) => (
              <div key={message.id} className={`flex items-start max-w-3xl mx-auto ${
                message.role === 'user' ? 'justify-end' : ''
              }`}>
                {message.role === 'assistant' && (
                  <div style={{ backgroundColor: 'var(--primary-color)' }} className="w-8 h-8 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                    <Bot size={16} color="white" />
                  </div>
                )}
                
                <div className={`chat-message rounded-lg p-5 max-w-[80%] ${message.role === 'user' ? 'chat-message-user' : 'chat-message-assistant'}`}
                  style={message.role === 'user' 
                    ? { 
                        backgroundColor: 'var(--primary-color)',
                        color: 'white' 
                      }
                    : {
                        backgroundColor: 'var(--card-bg)',
                        color: 'var(--text-primary)',
                        borderColor: 'var(--border-color)',
                        boxShadow: 'var(--shadow-sm)'
                      }
                  }
                >
                  <div 
                    dangerouslySetInnerHTML={{ __html: formatContent(message.content) }}
                  />
                  
                  {message.role === 'assistant' && message.modelUsed && (
                    <div className="mt-2 text-xs flex items-center justify-between" style={{ color: 'var(--text-muted)' }}>
                      <span>Model: {message.modelUsed}</span>
                      {settings?.ttsEnabled && (
                        <button 
                          className="ml-2 inline-flex items-center"
                          style={{ color: 'var(--primary-color)' }}
                          onClick={() => handlePlayTTS(message.content)}
                          disabled={tts.isSpeaking}
                        >
                          <Volume2 size={14} className="mr-1" />
                          <span>{tts.isSpeaking ? 'Playing...' : 'Listen'}</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
                
                {message.role === 'user' && (
                  <div style={{ backgroundColor: 'var(--bg-accent)' }} className="w-8 h-8 rounded-full flex items-center justify-center ml-4 flex-shrink-0">
                    <User size={16} style={{ color: 'var(--primary-color)' }} />
                  </div>
                )}
              </div>
            ))}
          </StaggeredChildren>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Chat input area */}
      <SlideIn direction="up" duration={0.4}>
        <div style={{ 
          backgroundColor: 'var(--bg-tertiary)', 
          borderColor: 'var(--border-color)' 
        }} className="p-4 border-t">
          <div className="max-w-3xl mx-auto">
            <form className="relative" onSubmit={handleSubmit}>
              <input 
                type="text" 
                placeholder="Ask something about your documents..." 
                style={{
                  backgroundColor: 'var(--input-bg)',
                  color: 'var(--text-primary)',
                  borderColor: 'var(--border-color)'
                }}
                className="w-full border rounded-lg py-3 px-4 pr-12 focus:outline-none focus:ring-2 transition-all duration-300 premium-shadow" 
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                disabled={isSubmitting}
              />
              <button 
                type="submit" 
                style={{ color: 'var(--primary-color)' }}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 transition-all duration-300 hover:scale-110 p-1 rounded-full hover:bg-opacity-10 hover:bg-primary"
                disabled={isSubmitting || !messageInput.trim()}
              >
                {isSubmitting ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <SendHorizontal size={18} />
                )}
              </button>
            </form>
            
            {/* Document requirement notice */}
            {selectedDocuments.length === 0 && (
              <FadeIn duration={0.5} delay={0.2}>
                <div className="mt-2 flex items-center justify-center text-xs" style={{ color: 'var(--text-muted)' }}>
                  <AlertCircle size={12} className="mr-1" style={{ color: 'var(--warning-color)' }} />
                  <span>Select documents in the Documents tab to provide context for your questions</span>
                </div>
              </FadeIn>
            )}
          </div>
        </div>
      </SlideIn>
    </div>
  );
}