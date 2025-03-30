import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { OllamaModel } from '@/types';

/**
 * Hook for Ollama integration
 */
export function useOllama() {
  const [isModelLoading, setIsModelLoading] = useState(false);
  
  // Fetch available Ollama models
  const { 
    data: models = [],
    isLoading,
    error,
    refetch
  } = useQuery<OllamaModel[]>({
    queryKey: ['/api/ollama/models'],
  });

  // Define the type for the Ollama status response
  interface OllamaStatus {
    running: boolean;
  }

  // Check if Ollama is running
  const {
    data: ollamaStatus = { running: false } as OllamaStatus,
    isLoading: statusLoading,
  } = useQuery<OllamaStatus>({
    queryKey: ['/api/ollama/status'],
    refetchInterval: 10000, // Check status every 10 seconds
  });

  // Refresh model list when Ollama status changes
  useEffect(() => {
    if (ollamaStatus && ollamaStatus.running) {
      refetch();
    }
  }, [ollamaStatus, refetch]);

  // Function to get model info
  const getModelInfo = async (modelName: string) => {
    try {
      const response = await fetch(`/api/ollama/models/${modelName}`);
      if (!response.ok) throw new Error('Failed to get model info');
      return await response.json();
    } catch (error) {
      console.error('Error getting model info:', error);
      return null;
    }
  };

  // Function to pull a model from Ollama
  const pullModel = async (modelName: string) => {
    setIsModelLoading(true);
    try {
      const response = await fetch('/api/ollama/models/pull', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: modelName }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to pull model: ${modelName}`);
      }
      
      await refetch();
      return true;
    } catch (error) {
      console.error('Error pulling model:', error);
      return false;
    } finally {
      setIsModelLoading(false);
    }
  };

  return {
    models,
    isLoading: isLoading || statusLoading,
    isModelLoading,
    error,
    ollamaRunning: ollamaStatus && ollamaStatus.running ? true : false,
    getModelInfo,
    pullModel,
    refreshModels: refetch,
  };
}
