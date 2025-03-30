import { exec, ExecOptions } from 'child_process';
import { promisify } from 'util';
import fetch from 'node-fetch';
import { log } from './vite';

// Define a type that includes stdio option for cross-platform compatibility
interface EnhancedExecOptions extends ExecOptions {
  stdio?: 'pipe' | 'ignore' | 'inherit' | Array<any>;
}

// Create a wrapper around execAsync that handles the enhanced options
const execAsyncBase = promisify(exec);
const execAsync = (command: string, options?: EnhancedExecOptions) => {
  // Filter out stdio option if present as it's not supported by Node.js exec
  if (options && 'stdio' in options) {
    const { stdio, ...standardOptions } = options;
    return execAsyncBase(command, standardOptions);
  }
  return execAsyncBase(command, options);
};

// Configure Ollama to use GPU with optimized settings for modern NVIDIA GPUs
// These environment variables optimize GPU memory usage and performance
process.env.OLLAMA_CUDA = '1';
process.env.OLLAMA_GPU_LAYERS = '-1'; // Use all available VRAM
process.env.OLLAMA_CUBLAS = '1';      // Enable cuBLAS for better performance
process.env.OLLAMA_VULKAN = '1';      // Enable Vulkan backend as fallback
process.env.OLLAMA_AVX = 'true';      // Enable AVX instructions for CPU operations

// Set NVIDIA-specific optimizations
process.env.CUDA_VISIBLE_DEVICES = '0';
process.env.TF_FORCE_GPU_ALLOW_GROWTH = 'true';
process.env.TF_GPU_THREAD_MODE = 'gpu_private';
process.env.TF_GPU_ALLOCATOR = 'cuda_malloc_async';

// Memory optimizations
process.env.TF_ENABLE_ONEDNN_OPTS = '1';

log('Set Ollama GPU environment variables with enhanced settings', 'ollama');

// Ollama API base URL - use environment variable if set, otherwise default
const OLLAMA_API_URL = process.env.OLLAMA_HOST ? 
  `${process.env.OLLAMA_HOST}/api` : 
  'http://localhost:11434/api';

log(`Using Ollama API URL: ${OLLAMA_API_URL}`, 'ollama');

/**
 * Check if Ollama is running
 * @returns Promise<boolean>
 */
export async function isOllamaRunning(): Promise<boolean> {
  try {
    const response = await fetch(`${OLLAMA_API_URL}/tags`);
    return response.ok;
  } catch (error) {
    return false;
  }
}

/**
 * Get list of available Ollama models
 * @returns Promise<Array<{name: string, size: string, modified: string}>>
 */
export async function getOllamaModels() {
  try {
    const response = await fetch(`${OLLAMA_API_URL}/tags`);
    if (!response.ok) {
      throw new Error(`Failed to get models: ${response.statusText}`);
    }
    
    const data = await response.json() as any;
    
    if (!data.models) {
      return [];
    }
    
    return data.models.map((model: any) => ({
      name: model.name,
      size: formatModelSize(model.size),
      modified: model.modified
    }));
  } catch (error) {
    console.error('Error getting Ollama models:', error);
    return [];
  }
}

/**
 * Run Ollama command
 * @param args Command arguments
 * @returns Promise<{stdout: string, stderr: string}>
 */
export async function runOllamaCommand(args: string): Promise<{stdout: string, stderr: string}> {
  try {
    const command = `ollama ${args}`;
    log(`Running command: ${command}`, 'ollama');
    const result = await execAsync(command);
    
    // Ensure we always return string values, not Buffer
    return {
      stdout: result.stdout ? (result.stdout.toString ? result.stdout.toString() : String(result.stdout)) : '',
      stderr: result.stderr ? (result.stderr.toString ? result.stderr.toString() : String(result.stderr)) : ''
    };
  } catch (error: any) {
    console.error('Error running Ollama command:', error);
    return { stdout: '', stderr: error.message };
  }
}

/**
 * Generate a response using Ollama with optimized GPU settings
 * @param model Model name
 * @param prompt User prompt
 * @param options Generation options
 * @returns Promise<string>
 */
export async function generateOllamaResponse(
  model: string, 
  prompt: string,
  options: {
    temperature?: number;
    topP?: number;
    context?: number[];
    stream?: boolean;
    gpuLayers?: number;
    useGpu?: boolean;
    ecoMode?: boolean;    // Added eco mode option to save VRAM
    temperatureProfile?: 'default' | 'light' | 'high' | 'overdrive';  // Added temperature profiles
  } = {}
): Promise<string> {
  try {
    // Log model usage for debugging
    log(`Generating response with model: ${model}`, 'ollama');
    
    // Process temperature profile settings
    let temperature = 0.7; // Default temperature
    
    if (options.temperature !== undefined) {
      temperature = parseFloat(options.temperature.toString());
    } else if (options.temperatureProfile) {
      // Apply temperature profiles
      switch (options.temperatureProfile) {
        case 'light':
          temperature = 0.5;
          break;
        case 'high':
          temperature = 0.85;
          break;
        case 'overdrive':
          temperature = 0.95;
          break;
        case 'default':
        default:
          temperature = 0.7;
      }
    }
    
    // Standard Ollama options
    const ollamaOptions: any = {
      temperature,
      top_p: options.topP !== undefined ? parseFloat(options.topP.toString()) : 0.9,
      num_ctx: options.context || 4096,
      // Add mirostat for stable outputs
      mirostat: 1,
      mirostat_eta: 0.1,
      mirostat_tau: 5.0,
    };
    
    // Add GPU configuration if enabled and available
    if (options.useGpu !== false) {
      // Force GPU acceleration
      ollamaOptions.num_gpu = 1;
      
      // Determine GPU layer allocation based on mode
      let gpuLayers = -1; // Default: use all available layers
      
      if (options.gpuLayers !== undefined) {
        // If explicitly specified, use that
        gpuLayers = options.gpuLayers;
      } else if (options.ecoMode) {
        // Eco mode: use 50% of layers to save VRAM
        // We'll use a minimum of 20 layers for base functionality
        gpuLayers = 20;
      } else if (process.env.OLLAMA_GPU_LAYERS && process.env.OLLAMA_GPU_LAYERS !== '-1') {
        // Use environment setting if not the default -1
        gpuLayers = parseInt(process.env.OLLAMA_GPU_LAYERS, 10);
      }
      
      ollamaOptions.num_gpu_layers = gpuLayers;
      
      // Optimize batch size if not in eco mode (uses more VRAM but faster)
      if (!options.ecoMode) {
        ollamaOptions.batch_size = 512;
        ollamaOptions.f16_kv = true;  // Use half precision for KV cache to save VRAM
      } else {
        // Eco mode: use smaller batch size
        ollamaOptions.batch_size = 256;
        ollamaOptions.f16_kv = true;
      }
      
      log(`Using GPU with ${gpuLayers === -1 ? 'all' : gpuLayers} layers${options.ecoMode ? ' (eco mode)' : ''}`, 'ollama');
    }
    
    // Make the API request with more robust error handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout
    
    try {
      const response = await fetch(`${OLLAMA_API_URL}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          prompt,
          options: ollamaOptions,
          stream: false
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Ollama API error (${response.status}): ${errorText || response.statusText}`);
      }
      
      const data = await response.json() as any;
      
      // Log performance metrics if available
      if (data.eval_count && data.eval_duration) {
        const tokensPerSecond = Math.round(data.eval_count / (data.eval_duration / 1000000000));
        log(`Performance: ${tokensPerSecond} tokens/sec`, 'ollama');
      }
      
      return data.response;
    } catch (fetchError) {
      clearTimeout(timeoutId);
      throw fetchError;
    }
  } catch (error) {
    console.error('Error generating Ollama response:', error);
    log(`Error generating response: ${(error as Error).message}`, 'ollama');
    throw error;
  }
}

/**
 * Format model size to human-readable format
 * @param bytes Size in bytes
 * @returns Formatted size string
 */
function formatModelSize(bytes: number): string {
  if (!bytes || bytes === 0) return 'Unknown size';
  
  const gigabytes = bytes / 1024 / 1024 / 1024;
  return `${gigabytes.toFixed(1)}GB`;
}

/**
 * Check if NVIDIA GPU is available - Enhanced for AMD+NVIDIA systems
 * @returns Promise<{available: boolean, name?: string, vram?: string}>
 */
export async function checkGpuAvailability(): Promise<{available: boolean, name?: string, vram?: string}> {
  try {
    // Try multiple methods to detect GPU
    let gpuName = '';
    let gpuVram = '';
    let detectionMethod = '';
    
    // Helper function to ensure string output from potentially Buffer results
    const ensureString = (output: string | Buffer | unknown): string => {
      if (output === null || output === undefined) {
        return '';
      }
      if (output instanceof Buffer) {
        return output.toString();
      }
      return String(output);
    };
    
    // Method 1: Standard nvidia-smi with more detailed info
    try {
      // Simply execute the command without redirection, Node.js handles errors properly
      const result = await execAsync('nvidia-smi --query-gpu=name,memory.total --format=csv,noheader');
      const stdout = ensureString(result.stdout);
      
      if (stdout) {
        const parts = stdout.trim().split(',').map((part: string) => part.trim());
        if (parts.length >= 2) {
          gpuName = parts[0];
          gpuVram = parts[1];
          detectionMethod = 'nvidia-smi';
        }
      }
    } catch (e) {
      // Continue to next method
    }
    
    // Method 1b: Alternative nvidia-smi format
    if (!gpuName) {
      try {
        // Simply execute the command without redirection, Node.js handles errors properly
        const result = await execAsync('nvidia-smi -L');
        const stdout = ensureString(result.stdout);
        
        if (stdout) {
          // Parse the -L format which looks like: "GPU 0: NVIDIA GeForce RTX 3050 (UUID: ...)"
          const match = stdout.match(/GPU \d+:\s+(NVIDIA [^(]+)/);
          if (match) {
            gpuName = match[1].trim();
            
            // Try to get VRAM separately
            try {
              // Simply execute the command without redirection
              const vramResult = await execAsync('nvidia-smi --query-gpu=memory.total --format=csv,noheader');
              const vramStdout = ensureString(vramResult.stdout);
              
              if (vramStdout) {
                gpuVram = vramStdout.trim();
              }
            } catch (e) {
              // Fallback - try another method for VRAM
              try {
                // Simply execute the command without redirection
                const vramResult = await execAsync('nvidia-smi | grep "MiB /" | awk \'{print $7$8}\'');
                const vramStdout = ensureString(vramResult.stdout);
                
                if (vramStdout) {
                  gpuVram = vramStdout.trim();
                }
              } catch (e) {
                // Ignore errors getting VRAM
              }
            }
            
            detectionMethod = 'nvidia-smi-L';
          }
        }
      } catch (e) {
        // Continue to next method
      }
    }
    
    // Method 2: Windows-specific detection methods for AMD+NVIDIA systems
    if (!gpuName && process.platform === 'win32') {
      // Enhanced WMI query that's more robust on AMD systems with NVIDIA GPUs
      try {
        // Simply execute the command without redirection
        const result = await execAsync('powershell "(Get-WmiObject Win32_VideoController | Where-Object { $_.Name -match \'NVIDIA\' } | Select-Object -First 1 | ForEach-Object { $_.Name + \'|\' + $_.AdapterRAM/1MB + \' MB\' })"');
        const stdout = ensureString(result.stdout);
        
        if (stdout && stdout.includes('|')) {
          const parts = stdout.trim().split('|');
          gpuName = parts[0].trim();
          if (parts.length > 1) {
            gpuVram = parts[1].trim();
          }
          detectionMethod = 'powershell-wmi';
        }
      } catch (e) {
        // Continue to next method
      }
      
      // DxDiag method specifically for WSL/Windows
      if (!gpuName) {
        try {
          // Simply execute the command without redirection
          const result = await execAsync('powershell "dxdiag /t dxdiag_output.txt && Select-String -Path dxdiag_output.txt -Pattern \'NVIDIA\',\'Dedicated Memory\'"');
          const stdout = ensureString(result.stdout);
          
          if (stdout && stdout.includes('NVIDIA')) {
            // Extract GPU name and VRAM from dxdiag output
            const nameMatch = stdout.match(/Name:\s+(NVIDIA [^\r\n]+)/);
            const vramMatch = stdout.match(/Dedicated Memory:\s+([0-9,]+ MB)/);
            
            if (nameMatch) {
              gpuName = nameMatch[1].trim();
              if (vramMatch) {
                gpuVram = vramMatch[1].trim();
              }
              detectionMethod = 'dxdiag';
            }
          }
        } catch (e) {
          // Continue to next method
        }
      }
    }
    
    // Method 3: Linux-specific methods with enhanced VRAM detection
    if (!gpuName && process.platform === 'linux') {
      try {
        // Simply execute the command without redirection
        const result = await execAsync('lspci | grep -i nvidia');
        const stdout = ensureString(result.stdout);
        
        if (stdout) {
          // Extract basic GPU name from lspci output
          const match = stdout.match(/NVIDIA Corporation (.*?)(?:\[|\(|$)/);
          gpuName = match ? match[1].trim() : 'NVIDIA GPU';
          
          // Try to get VRAM using nvidia-settings
          try {
            // Simply execute the command without redirection
            const vramResult = await execAsync('nvidia-settings -q TotalDedicatedGPUMemory -t');
            const vramStdout = ensureString(vramResult.stdout);
            
            if (vramStdout) {
              const vramMb = parseInt(vramStdout.trim());
              if (!isNaN(vramMb)) {
                gpuVram = `${vramMb} MB`;
              }
            }
          } catch (e) {
            // Ignore errors getting VRAM
          }
          
          detectionMethod = 'lspci';
        }
      } catch (e) {
        // All methods failed
      }
    }
    
    if (!gpuName) {
      log('No NVIDIA GPU detected through any detection method', 'ollama');
      return { available: false };
    }

    // Set enhanced Ollama environment variables for optimal GPU use
    process.env.OLLAMA_CUDA = '1';
    process.env.OLLAMA_GPU_LAYERS = '-1'; // Use all available VRAM
    process.env.OLLAMA_CUBLAS = '1';      // Enable cuBLAS for better performance
    process.env.OLLAMA_VULKAN = '1';      // Enable Vulkan as fallback
    
    log(`GPU detected for Ollama (${detectionMethod}): ${gpuName}${gpuVram ? ` with ${gpuVram}` : ''}`, 'ollama');
    return { 
      available: true, 
      name: gpuName,
      vram: gpuVram || undefined
    };
  } catch (error) {
    log(`Error checking GPU availability: ${(error as Error).message}`, 'ollama');
    return { available: false };
  }
}
