import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import { storage } from "./storage";
import { Message, Document, Settings, OllamaModel } from "@shared/schema";
import { isOllamaRunning, getOllamaModels, generateOllamaResponse, checkGpuAvailability } from "./ollama";
import { setupNvidiaEnvironment } from "./gpu-setup";
import { saveUploadedFile, deleteDocumentFile, extractDocumentContent, isAllowedFileType } from "./documents";
import { validateTtsContent, formatTextForTts } from "./tts";
import { log } from "./vite";
import { z } from "zod";

// Create temporary memory storage for documents, settings, etc.
interface MemoryStore {
  documents: Document[];
  messages: Message[];
  settings: Settings;
  ollamaModels: OllamaModel[];
}

// Initialize with default values
const memStore: MemoryStore = {
  documents: [],
  messages: [],
  settings: {
    id: 1,
    selectedModel: "mistral",
    temperature: "0.7",
    temperatureProfile: "default",
    contextLength: 4096,
    chunkSize: 512,
    topP: "0.9",
    ecoMode: true,
    gpuAcceleration: true,
    ttsEnabled: true,
    ttsVoice: "alloy",
    ttsSpeechRate: "1.0",
  },
  ollamaModels: [],
};

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// Input validation schemas
const messageSchema = z.object({
  content: z.string().min(1),
  role: z.enum(["user", "assistant"]),
});

const documentSelectSchema = z.object({
  selected: z.boolean(),
});

const settingsUpdateSchema = z.object({
  selectedModel: z.string().optional(),
  temperature: z.string().optional(),
  temperatureProfile: z.string().optional(),
  contextLength: z.number().optional(),
  chunkSize: z.number().optional(),
  topP: z.string().optional(),
  ecoMode: z.boolean().optional(),
  gpuAcceleration: z.boolean().optional(),
  ttsEnabled: z.boolean().optional(),
  ttsVoice: z.string().optional(),
  ttsSpeechRate: z.string().optional(),
});

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Initialize Ollama models on startup
  refreshOllamaModels();
  
  // API Routes
  app.get("/api/messages", (req, res) => {
    res.json(memStore.messages);
  });
  
  app.post("/api/messages", async (req, res) => {
    try {
      const validatedData = messageSchema.parse(req.body);
      
      // Add user message
      const userMessage: Message = {
        id: getNextId(memStore.messages),
        role: validatedData.role,
        content: validatedData.content,
        timestamp: new Date(), // Use Date object directly
        documentIds: memStore.documents
          .filter(doc => doc.selected)
          .map(doc => doc.id.toString()),
        modelUsed: null,
      };
      
      memStore.messages.push(userMessage);
      
      // Generate AI response if the message is from the user
      if (validatedData.role === "user") {
        // Prepare context from selected documents
        const documentContext = memStore.documents
          .filter(doc => doc.selected)
          .map(doc => doc.content || "")
          .join("\n\n");
        
        // Build prompt with document context
        let prompt = validatedData.content;
        if (documentContext) {
          prompt = `Context information from the selected documents:\n${documentContext}\n\nUser question: ${validatedData.content}\n\nPlease answer based on the context provided.`;
        }
        
        try {
          // Get model to use
          const modelToUse = memStore.settings.selectedModel || "mistral";
          
          // Check if Ollama is running
          if (!(await isOllamaRunning())) {
            throw new Error("Ollama is not running. Please start Ollama to generate responses.");
          }
          
          // Generate response using Ollama with GPU if available
          const systemStatus = await checkGpuAvailability();
          const useGpu = systemStatus.available && memStore.settings.gpuAcceleration !== false;
          
          log(`Using GPU for Ollama: ${useGpu ? 'Yes' : 'No'}`, 'routes');
          if (useGpu) {
            log(`GPU detected: ${systemStatus.name}`, 'routes');
          }
          
          // Generate response with GPU parameters if available
          const aiResponse = await generateOllamaResponse(modelToUse, prompt, {
            temperature: parseFloat(memStore.settings.temperature || '0.7'),
            topP: parseFloat(memStore.settings.topP || '0.9'),
            context: [memStore.settings.contextLength || 4096],
            useGpu: useGpu,
            gpuLayers: useGpu ? -1 : undefined, // Use all available VRAM
          });
          
          // Add AI message
          const assistantMessage: Message = {
            id: getNextId(memStore.messages),
            role: "assistant",
            content: aiResponse,
            timestamp: new Date(), // Use Date object directly
            documentIds: memStore.documents
              .filter(doc => doc.selected)
              .map(doc => doc.id.toString()),
            modelUsed: modelToUse,
          };
          
          memStore.messages.push(assistantMessage);
        } catch (error: any) {
          // Add error message as assistant response
          const errorMessage: Message = {
            id: getNextId(memStore.messages),
            role: "assistant",
            content: `I'm sorry, I encountered an error: ${error.message || "Unknown error"}. Please check that Ollama is running and try again.`,
            timestamp: new Date(), // Use Date object directly
            documentIds: [],
            modelUsed: "error",
          };
          
          memStore.messages.push(errorMessage);
        }
      }
      
      res.status(201).json(memStore.messages);
    } catch (error) {
      res.status(400).json({ error: "Invalid message data" });
    }
  });
  
  app.delete("/api/messages", (req, res) => {
    memStore.messages = [];
    res.json({ message: "Chat cleared" });
  });
  
  app.get("/api/documents", (req, res) => {
    res.json(memStore.documents);
  });
  
  app.post("/api/documents", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }
      
      // Check file type
      if (!isAllowedFileType(req.file.mimetype)) {
        return res.status(400).json({ error: "File type not supported" });
      }
      
      // Save the file
      const fileInfo = await saveUploadedFile(req.file);
      
      // Extract content (simple implementation)
      const content = await extractDocumentContent(fileInfo.path);
      
      // Create document record
      const newDocument: Document = {
        id: getNextId(memStore.documents),
        filename: fileInfo.filename,
        filesize: fileInfo.filesize,
        filetype: fileInfo.filetype,
        uploadDate: new Date(), // Use Date object directly
        content,
        path: fileInfo.path,
        selected: false,
      };
      
      memStore.documents.push(newDocument);
      
      res.status(201).json(newDocument);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to upload document" });
    }
  });
  
  app.delete("/api/documents/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    const documentIndex = memStore.documents.findIndex(doc => doc.id === id);
    
    if (documentIndex === -1) {
      return res.status(404).json({ error: "Document not found" });
    }
    
    const document = memStore.documents[documentIndex];
    
    // Delete file from disk
    await deleteDocumentFile(document.path);
    
    // Remove from memory store
    memStore.documents.splice(documentIndex, 1);
    
    res.json({ message: "Document deleted" });
  });
  
  app.patch("/api/documents/:id/select", (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { selected } = documentSelectSchema.parse(req.body);
      
      const documentIndex = memStore.documents.findIndex(doc => doc.id === id);
      
      if (documentIndex === -1) {
        return res.status(404).json({ error: "Document not found" });
      }
      
      // Update document selection
      memStore.documents[documentIndex].selected = selected;
      
      res.json(memStore.documents[documentIndex]);
    } catch (error) {
      res.status(400).json({ error: "Invalid request data" });
    }
  });
  
  app.get("/api/settings", (req, res) => {
    res.json(memStore.settings);
  });
  
  app.patch("/api/settings", (req, res) => {
    try {
      const updates = settingsUpdateSchema.parse(req.body);
      
      // Update settings
      memStore.settings = {
        ...memStore.settings,
        ...updates,
      };
      
      res.json(memStore.settings);
    } catch (error) {
      res.status(400).json({ error: "Invalid settings data" });
    }
  });
  
  app.get("/api/ollama/models", async (req, res) => {
    try {
      // Refresh from Ollama
      await refreshOllamaModels();
      
      res.json(memStore.ollamaModels);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to get Ollama models" });
    }
  });
  
  app.get("/api/ollama/status", async (req, res) => {
    try {
      const running = await isOllamaRunning();
      res.json({ running });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to check Ollama status" });
    }
  });
  
  app.post("/api/ollama/models/pull", async (req, res) => {
    try {
      const { name } = req.body;
      
      if (!name) {
        return res.status(400).json({ error: "Model name is required" });
      }
      
      // In a real implementation, we would call Ollama to pull the model
      // For now, we'll just simulate it
      res.json({ message: `Started pulling model: ${name}` });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to pull model" });
    }
  });
  
  app.get("/api/system/status", async (req, res) => {
    try {
      const ollamaRunning = await isOllamaRunning();
      
      // Get detailed GPU information
      const nvidiaGpuInfo = setupNvidiaEnvironment();
      
      // Fallback to simple GPU detection if detailed detection fails
      const gpuInfo = nvidiaGpuInfo.available 
        ? { available: true, name: nvidiaGpuInfo.gpuName } 
        : await checkGpuAvailability();
      
      res.json({
        ollamaRunning,
        gpuAvailable: gpuInfo.available,
        gpuName: gpuInfo.name,
        gpuDetails: nvidiaGpuInfo.available ? {
          driverVersion: nvidiaGpuInfo.driverVersion,
          cudaVersion: nvidiaGpuInfo.cudaVersion
        } : null,
        wsl: {
          enabled: process.platform === 'linux' && process.env.WSL_DISTRO_NAME !== undefined,
          distribution: process.env.WSL_DISTRO_NAME || null
        }
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to get system status" });
    }
  });
  
  app.post("/api/tts/process", (req, res) => {
    try {
      const { text, voice, rate } = req.body;
      
      if (!validateTtsContent(text)) {
        return res.status(400).json({ error: "Invalid text content for TTS" });
      }
      
      const formattedText = formatTextForTts(text);
      
      // In a production environment, we might use a TTS service here
      // For now, we just return the formatted text for client-side TTS
      res.json({ 
        text: formattedText,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to process TTS request" });
    }
  });
  
  return httpServer;
}

// Helper to get next ID
function getNextId(items: { id: number }[]): number {
  return items.length > 0 ? Math.max(...items.map(item => item.id)) + 1 : 1;
}

// Helper to refresh Ollama models
async function refreshOllamaModels() {
  try {
    const isRunning = await isOllamaRunning();
    
    if (isRunning) {
      const models = await getOllamaModels();
      
      // Create OllamaModel objects
      memStore.ollamaModels = models.map((model: any, index: number) => ({
        id: index + 1,
        name: model.name,
        size: model.size,
        modified: model.modified || new Date(), // Use Date object directly
        details: {},
      }));
    }
  } catch (error) {
    console.error("Failed to refresh Ollama models:", error);
  }
}
