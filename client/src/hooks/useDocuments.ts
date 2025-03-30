import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Document } from '@/types';
import { apiRequest } from '@/lib/queryClient';

/**
 * Hook for managing documents
 */
export function useDocuments() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  // Fetch all documents
  const { 
    data: documents = [],
    isLoading,
    error
  } = useQuery<Document[]>({
    queryKey: ['/api/documents'],
  });
  
  // Filter selected and available documents
  const selectedDocuments = documents.filter(doc => doc.selected);
  const availableDocuments = documents.filter(doc => !doc.selected);
  
  // Upload document mutation
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/documents', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to upload document');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
      toast({
        title: "Document uploaded",
        description: "Document has been successfully uploaded",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Delete document mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest('DELETE', `/api/documents/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
      toast({
        title: "Document deleted",
        description: "Document has been permanently removed",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Delete failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Toggle document selection mutation
  const toggleSelectionMutation = useMutation({
    mutationFn: async ({ id, selected }: { id: number; selected: boolean }) => {
      return apiRequest('PATCH', `/api/documents/${id}/select`, { selected });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Selection failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Upload handler
  const handleUpload = async (file: File) => {
    if (!file) return;
    
    setIsUploading(true);
    try {
      await uploadMutation.mutateAsync(file);
    } finally {
      setIsUploading(false);
    }
  };
  
  // Open file dialog
  const openFileDialog = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      handleUpload(files[0]);
    }
    
    // Reset the input
    if (event.target) {
      event.target.value = '';
    }
  };
  
  return {
    documents,
    selectedDocuments,
    availableDocuments,
    isLoading,
    isUploading,
    error,
    fileInputRef,
    openFileDialog,
    handleFileSelect,
    uploadDocument: handleUpload,
    deleteDocument: (id: number) => deleteMutation.mutateAsync(id),
    selectDocument: (id: number) => toggleSelectionMutation.mutateAsync({ id, selected: true }),
    unselectDocument: (id: number) => toggleSelectionMutation.mutateAsync({ id, selected: false }),
  };
}
