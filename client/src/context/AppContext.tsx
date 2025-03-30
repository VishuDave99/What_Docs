import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Message, Document, Settings, OllamaModel, SystemStatus } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface AppContextType {
  // Chat state
  messages: Message[];
  sendMessage: (content: string) => Promise<void>;
  clearChat: () => Promise<void>;
  
  // Document state
  selectedDocuments: Document[];
  availableDocuments: Document[];
  uploadDocument: (file: File) => Promise<void>;
  deleteDocument: (id: number) => Promise<void>;
  selectDocument: (id: number) => Promise<void>;
  removeDocumentSelection: (id: number) => Promise<void>;
  
  // Settings state
  settings: Settings | null;
  updateSettings: (updates: Partial<Settings>) => Promise<void>;
  
  // Ollama state
  ollamaModels: OllamaModel[];
  systemStatus: SystemStatus;
  
  // UI state
  isLoading: boolean;
  activeView: 'chat' | 'documents' | 'settings';
  setActiveView: (view: 'chat' | 'documents' | 'settings') => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeView, setActiveView] = useState<'chat' | 'documents' | 'settings'>('chat');
  
  // Fetch messages
  const { 
    data: messages = [],
    isLoading: messagesLoading,
    error: messagesError
  } = useQuery<Message[]>({
    queryKey: ['/api/messages'],
  });
  
  // Fetch documents
  const { 
    data: documents = [],
    isLoading: documentsLoading,
    error: documentsError
  } = useQuery<Document[]>({
    queryKey: ['/api/documents'],
  });
  
  // Fetch settings
  const { 
    data: settings,
    isLoading: settingsLoading,
    error: settingsError
  } = useQuery<Settings>({
    queryKey: ['/api/settings'],
  });
  
  // Fetch Ollama models
  const { 
    data: ollamaModels = [],
    isLoading: ollamaModelsLoading,
    error: ollamaModelsError
  } = useQuery<OllamaModel[]>({
    queryKey: ['/api/ollama/models'],
  });
  
  // Fetch system status
  const { 
    data: systemStatus = { ollamaRunning: false, gpuAvailable: false },
    isLoading: systemStatusLoading,
    error: systemStatusError
  } = useQuery<SystemStatus>({
    queryKey: ['/api/system/status'],
    refetchInterval: 30000, // Refetch every 30 seconds
  });
  
  // Filter documents
  const selectedDocuments = documents.filter(doc => doc.selected);
  const availableDocuments = documents.filter(doc => !doc.selected);
  
  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      return apiRequest('POST', '/api/messages', { content, role: 'user' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
    },
    onError: (error) => {
      toast({
        title: "Error sending message",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Clear chat mutation
  const clearChatMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('DELETE', '/api/messages');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
      toast({
        title: "Chat cleared",
        description: "All messages have been removed",
      });
    },
    onError: (error) => {
      toast({
        title: "Error clearing chat",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Upload document mutation
  const uploadDocumentMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      
      return fetch('/api/documents', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
      toast({
        title: "Document uploaded",
        description: "Document has been uploaded successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error uploading document",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Delete document mutation
  const deleteDocumentMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest('DELETE', `/api/documents/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
      toast({
        title: "Document deleted",
        description: "Document has been deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error deleting document",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Select document mutation
  const selectDocumentMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest('PATCH', `/api/documents/${id}/select`, { selected: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
    },
    onError: (error) => {
      toast({
        title: "Error selecting document",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Remove document selection mutation
  const removeDocumentSelectionMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest('PATCH', `/api/documents/${id}/select`, { selected: false });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
    },
    onError: (error) => {
      toast({
        title: "Error removing document selection",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (updates: Partial<Settings>) => {
      return apiRequest('PATCH', '/api/settings', updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
    },
    onError: (error) => {
      toast({
        title: "Error updating settings",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Log errors when they occur
  useEffect(() => {
    const errors = [messagesError, documentsError, settingsError, ollamaModelsError, systemStatusError].filter(Boolean);
    errors.forEach(error => {
      if (error) {
        console.error(error);
        toast({
          title: "Error loading data",
          description: error.message,
          variant: "destructive",
        });
      }
    });
  }, [messagesError, documentsError, settingsError, ollamaModelsError, systemStatusError, toast]);
  
  const isLoading = messagesLoading || documentsLoading || settingsLoading || ollamaModelsLoading || systemStatusLoading;
  
  const contextValue: AppContextType = {
    // Chat
    messages,
    sendMessage: async (content) => {
      await sendMessageMutation.mutateAsync(content);
    },
    clearChat: async () => {
      await clearChatMutation.mutateAsync();
    },
    
    // Documents
    selectedDocuments,
    availableDocuments,
    uploadDocument: async (file) => {
      await uploadDocumentMutation.mutateAsync(file);
    },
    deleteDocument: async (id) => {
      await deleteDocumentMutation.mutateAsync(id);
    },
    selectDocument: async (id) => {
      await selectDocumentMutation.mutateAsync(id);
    },
    removeDocumentSelection: async (id) => {
      await removeDocumentSelectionMutation.mutateAsync(id);
    },
    
    // Settings
    settings: settings || null,
    updateSettings: async (updates) => {
      await updateSettingsMutation.mutateAsync(updates);
    },
    
    // Ollama
    ollamaModels,
    systemStatus,
    
    // UI
    isLoading,
    activeView,
    setActiveView,
  };
  
  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
