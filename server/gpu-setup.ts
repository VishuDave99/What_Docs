import { execSync, ExecSyncOptions } from 'child_process';
import { log } from './vite';

// Define enhanced execSync options that include cross-platform stdio handling
interface EnhancedExecSyncOptions extends ExecSyncOptions {
  stdio?: 'pipe' | 'ignore' | 'inherit' | Array<any>;
}

// Create a wrapper around execSync that handles the stdio redirection safely
function safeExecSync(command: string, options?: EnhancedExecSyncOptions): Buffer | string {
  // Default encoding to utf8
  const fullOptions: EnhancedExecSyncOptions = { 
    encoding: 'utf8', 
    ...(options || {})
  };
  
  try {
    return execSync(command, fullOptions);
  } catch (error) {
    // Silently handle failures, which is what stderr redirection would do
    if (fullOptions.encoding === 'utf8') {
      return '';
    }
    return Buffer.from('');
  }
}

/**
 * Detect NVIDIA GPU and setup environment - Enhanced for AMD+NVIDIA systems
 * @returns {Object} GPU information or null if no GPU detected
 */
export function setupNvidiaEnvironment(): { 
  available: boolean; 
  gpuName?: string; 
  driverVersion?: string; 
  cudaVersion?: string; 
} {
  try {
    // Try multiple approaches to detect NVIDIA GPU
    let gpuInfoOutput = '';
    let detectionMethod = '';
    
    // Approach 1: Standard nvidia-smi (most reliable when available)
    // Use safeExecSync to handle errors without creating 'nul' files
    gpuInfoOutput = safeExecSync('nvidia-smi --query-gpu=name,driver_version --format=csv,noheader', { 
      encoding: 'utf8' 
    }) as string;
      
    if (gpuInfoOutput) {
      detectionMethod = 'nvidia-smi';
    } else {
      log('Standard nvidia-smi failed, trying alternative methods', 'gpu-setup');
    }

    // Try nvidia-smi with alternative options for some systems
    if (!gpuInfoOutput) {
      // Use safeExecSync to handle errors without creating 'nul' files
      gpuInfoOutput = safeExecSync('nvidia-smi -L', { 
        encoding: 'utf8'
      }) as string;
      
      if (gpuInfoOutput) {
        // Parse the -L format which looks like: "GPU 0: NVIDIA GeForce RTX 3050 (UUID: ...)"
        const match = gpuInfoOutput.match(/GPU \d+:\s+(NVIDIA [^(]+)/);
        if (match) {
          // Try to get driver version separately
          let driverVersion = 'Unknown';
          
          // Use safeExecSync to handle errors without creating 'nul' files
          const verOutput = safeExecSync('nvidia-smi --query-gpu=driver_version --format=csv,noheader', {
            encoding: 'utf8'
          }) as string;
          
          if (verOutput) {
            driverVersion = verOutput.trim();
          } else {
            // Fallback method for driver version
            const altVerOutput = safeExecSync('nvidia-smi | grep "Driver Version" | awk \'{print $3}\'', {
              encoding: 'utf8'
            }) as string;
            
            if (altVerOutput) {
              driverVersion = altVerOutput.trim();
            }
          }
          
          gpuInfoOutput = `${match[1].trim()}, ${driverVersion}`;
          detectionMethod = 'nvidia-smi-L';
        }
      } else {
        log('Alternative nvidia-smi method failed', 'gpu-setup');
      }
    }
    
    // Approach 2: Windows-specific detection methods
    if (!gpuInfoOutput && process.platform === 'win32') {
      // Try Windows Management Instrumentation (only on Windows)
      // Use safeExecSync to handle errors without creating 'nul' files
      gpuInfoOutput = safeExecSync('powershell "Get-WmiObject Win32_VideoController | Where-Object { $_.Name -match \'NVIDIA\' } | ForEach-Object { $_.Name + \', \' + $_.DriverVersion }"', {
        encoding: 'utf8',
        timeout: 5000 // Timeout to avoid hanging
      }) as string;
      
      if (gpuInfoOutput) {
        detectionMethod = 'powershell-wmi';
      } else {
        log('PowerShell WMI query failed', 'gpu-setup');
        
        // Try Windows device manager query specifically for WSL (only on Windows)
        // Use safeExecSync to handle errors without creating 'nul' files
        const dxdiagOutput = safeExecSync('powershell "dxdiag /t dxdiag_output.txt && Select-String -Path dxdiag_output.txt -Pattern \'NVIDIA\'"', {
          encoding: 'utf8',
          timeout: 5000 // Timeout to avoid hanging
        }) as string;
        
        if (dxdiagOutput && dxdiagOutput.includes('NVIDIA')) {
          // Extract GPU name and driver version from dxdiag output
          const nameMatch = dxdiagOutput.match(/Name:\s+(NVIDIA [^\r\n]+)/);
          const driverMatch = dxdiagOutput.match(/Driver:\s+([0-9.]+)/);
          
          const gpuName = nameMatch ? nameMatch[1].trim() : 'NVIDIA GPU';
          const driverVersion = driverMatch ? driverMatch[1].trim() : 'Unknown';
          
          gpuInfoOutput = `${gpuName}, ${driverVersion}`;
          detectionMethod = 'dxdiag';
        } else {
          log('DxDiag detection failed', 'gpu-setup');
        }
      }
    }
    
    // Approach 3: Linux-specific methods
    if (!gpuInfoOutput && process.platform === 'linux') {
      // Linux lspci command to detect NVIDIA hardware - only on Linux systems
      // Use safeExecSync to handle errors without creating 'nul' files
      const lspciOutput = safeExecSync('lspci | grep -i nvidia', {
        encoding: 'utf8'
      }) as string;
      
      if (lspciOutput) {
        // Extract basic GPU name from lspci output
        const match = lspciOutput.match(/NVIDIA Corporation (.*?)(?:\[|\(|$)/);
        const gpuName = match ? match[1].trim() : 'NVIDIA GPU';
        
        // Try to get driver version from modinfo
        let driverVersion = 'Unknown';
        
        // Use safeExecSync to handle errors without creating 'nul' files
        const modInfoOutput = safeExecSync('modinfo nvidia | grep "^version:" | awk \'{print $2}\'', {
          encoding: 'utf8'
        }) as string;
        
        if (modInfoOutput) {
          driverVersion = modInfoOutput.trim();
        } else {
          // Alternative method with proc filesystem
          const procOutput = safeExecSync('cat /proc/driver/nvidia/version | head -n 1 | awk \'{print $8}\'', {
            encoding: 'utf8'
          }) as string;
          
          if (procOutput) {
            driverVersion = procOutput.trim();
          }
        }
        
        gpuInfoOutput = `${gpuName}, ${driverVersion}`;
        detectionMethod = 'lspci';
      } else {
        log('lspci detection failed', 'gpu-setup');
      }
    }
    
    // Check if we found a GPU
    if (!gpuInfoOutput) {
      log('No NVIDIA GPU detected or drivers not installed through multiple detection methods', 'gpu-setup');
      return { available: false };
    }
    
    // Parse GPU info - handle different formats gracefully
    let gpuName, driverVersion;
    const parts = gpuInfoOutput.trim().split(', ');
    
    // Make sure we have at least 2 parts - if not, use defaults
    if (parts.length >= 2) {
      [gpuName, driverVersion] = parts;
    } else {
      gpuName = parts[0] || 'NVIDIA GPU';
      driverVersion = 'Unknown';
    }
    
    // Determine compatible CUDA version based on driver
    const cudaVersion = determineCudaVersion(driverVersion);
    
    log(`NVIDIA GPU detected (${detectionMethod}): ${gpuName}`, 'gpu-setup');
    log(`Driver Version: ${driverVersion}`, 'gpu-setup');
    log(`Compatible CUDA Version: ${cudaVersion}`, 'gpu-setup');
    
    // Set environment variables for optimal GPU usage
    process.env.NVIDIA_VISIBLE_DEVICES = 'all';
    process.env.NVIDIA_DRIVER_CAPABILITIES = 'compute,utility';
    process.env.CUDA_VISIBLE_DEVICES = '0';
    process.env.TF_FORCE_GPU_ALLOW_GROWTH = 'true';
    process.env.TF_GPU_ALLOCATOR = 'cuda_malloc_async';
    
    // Enhanced Ollama-specific environment variables
    process.env.OLLAMA_CUDA = '1';
    process.env.OLLAMA_GPU_LAYERS = '-1'; // Use all available VRAM
    process.env.OLLAMA_CUBLAS = '1';    // Enable cuBLAS for better performance
    process.env.OLLAMA_VULKAN = '1';    // Enable Vulkan backend as a fallback
    
    return {
      available: true,
      gpuName,
      driverVersion,
      cudaVersion
    };
  } catch (error) {
    log('Error detecting NVIDIA GPU: ' + (error as Error).message, 'gpu-setup');
    return { available: false };
  }
}

/**
 * Determine compatible CUDA version based on driver version
 * @param {string} driverVersion NVIDIA driver version
 * @returns {string} Compatible CUDA version
 */
function determineCudaVersion(driverVersion: string): string {
  // Driver to CUDA compatibility mapping
  // Source: https://docs.nvidia.com/cuda/cuda-toolkit-release-notes/index.html
  const driverVersionNum = parseFloat(driverVersion);
  
  // Updated for latest NVIDIA drivers as of March 2025
  if (driverVersionNum >= 570.00) return '12.8';
  if (driverVersionNum >= 550.00) return '12.7';
  if (driverVersionNum >= 545.00) return '12.6';
  if (driverVersionNum >= 535.00) return '12.5';
  if (driverVersionNum >= 530.00) return '12.4';
  if (driverVersionNum >= 528.00) return '12.3';
  if (driverVersionNum >= 527.00) return '12.2';
  if (driverVersionNum >= 525.85) return '12.1';
  if (driverVersionNum >= 525.60) return '12.0';
  if (driverVersionNum >= 520.61) return '11.8';
  if (driverVersionNum >= 515.43) return '11.7';
  if (driverVersionNum >= 510.39) return '11.6';
  if (driverVersionNum >= 495.29) return '11.5';
  if (driverVersionNum >= 470.57) return '11.4';
  if (driverVersionNum >= 465.19) return '11.3';
  if (driverVersionNum >= 460.27) return '11.2';
  if (driverVersionNum >= 455.23) return '11.1';
  if (driverVersionNum >= 450.36) return '11.0';
  if (driverVersionNum >= 440.33) return '10.2';
  if (driverVersionNum >= 418.39) return '10.1';
  if (driverVersionNum >= 410.48) return '10.0';
  
  return 'unknown';
}

// Docker support has been completely removed