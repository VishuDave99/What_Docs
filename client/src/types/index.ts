// API response types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  error?: string;
}

// Document type
export interface Document {
  id: number;
  filename: string;
  filesize: number;
  filetype: string;
  uploadDate: Date | string; // Allow both Date object and string for compatibility
  path: string;
  selected: boolean;
  content?: string; // Optional extracted text content
}

// Message type
export interface Message {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date | string; // Allow both Date object and string for compatibility
  documentIds?: string[];
  modelUsed?: string;
}

// Ollama model type
export interface OllamaModel {
  id: number;
  name: string;
  size?: string;
  modified?: Date | string; // Allow both Date object and string for compatibility
  details?: Record<string, any>;
}

// Settings type
export interface Settings {
  id: number;
  selectedModel: string;
  temperature: string;
  temperatureProfile?: 'default' | 'light' | 'high' | 'overdrive';
  contextLength: number;
  chunkSize: number;
  topP: string;
  ecoMode: boolean;
  gpuAcceleration: boolean;
  ttsEnabled: boolean;
  ttsVoice: string;
  ttsSpeechRate: string;
}

// System status type
export interface SystemStatus {
  ollamaRunning: boolean;
  gpuAvailable: boolean;
  gpuName?: string;
}
