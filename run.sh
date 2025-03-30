#!/bin/bash

echo "==================================================================="
echo "                     DocChat AI Application"
echo "==================================================================="
echo ""

echo "[INFO] Checking prerequisites..."

echo "[INFO] Checking for Node.js..."
if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js is required but not found."
    echo "Please install Node.js from https://nodejs.org/"
    echo ""
    exit 1
fi
echo "[OK] Node.js found."

echo "[INFO] Checking for npm..."
if ! command -v npm &> /dev/null; then
    echo "[ERROR] npm is required but not found."
    echo "Please install Node.js which includes npm."
    echo ""
    exit 1
fi
echo "[OK] npm found."

echo "[INFO] Checking for NVIDIA GPU..."
if ! command -v nvidia-smi &> /dev/null; then
    echo "[WARNING] NVIDIA GPU tools not found in PATH. Will run in CPU-only mode."
    echo "To enable GPU acceleration, please install NVIDIA drivers."
else
    echo "[INFO] Detecting NVIDIA GPU..."
    nvidia-smi --query-gpu=name,driver_version --format=csv,noheader
    
    if command -v nvcc &> /dev/null; then
        echo "[INFO] CUDA Version: $(nvcc --version | grep release)"
    fi
    
    echo "[OK] NVIDIA GPU setup complete."
fi

echo "[INFO] Checking for dependencies..."
if [ ! -d "node_modules" ]; then
    echo "[INFO] Installing dependencies. This may take a few minutes..."
    npm install
    if [ $? -ne 0 ]; then
        echo "[ERROR] Failed to install dependencies."
        echo ""
        exit 1
    fi
    echo "[OK] Dependencies installed successfully."
else
    echo "[OK] Dependencies already installed."
fi

echo "[INFO] Checking for uploads directory..."
if [ ! -d "uploads" ]; then
    mkdir uploads
    echo "[INFO] Created uploads directory."
fi

echo "[INFO] Starting the application..."
echo "[INFO] Browser will open automatically when the application starts."
echo "[INFO] Press Ctrl+C to stop the application when done."
echo ""

echo "[INFO] Setting environment variables for GPU acceleration..."
export NODE_OPTIONS="--max_old_space_size=8192"
export OLLAMA_HOST="http://localhost:11434"
export PORT=5000
export CUDA_VISIBLE_DEVICES=0
export TF_FORCE_GPU_ALLOW_GROWTH=true
export TF_GPU_ALLOCATOR=cuda_malloc_async
export OLLAMA_CUDA=1
export OLLAMA_GPU_LAYERS=-1
export OLLAMA_CUBLAS=1
export OLLAMA_VULKAN=1

echo "[INFO] Launching application and browser..."
sleep 2

echo "[INFO] Starting application server..."

# Create logs directory if it doesn't exist
if [ ! -d "logs" ]; then
    mkdir logs
fi

# Start the server with output redirected to log file
npm run dev > logs/server.log 2>&1 &
SERVER_PID=$!

# Wait for server to start
echo "[INFO] Waiting for server to start..."
sleep 5

# Open the browser based on platform
echo "[INFO] Opening browser at http://localhost:5000"
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    open "http://localhost:5000"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    if command -v xdg-open &> /dev/null; then
        xdg-open "http://localhost:5000"
    elif command -v gnome-open &> /dev/null; then
        gnome-open "http://localhost:5000"
    else
        echo "[WARNING] Could not automatically open browser. Please manually visit: http://localhost:5000"
    fi
else
    echo "[WARNING] Could not automatically open browser. Please manually visit: http://localhost:5000"
fi

# Show the most recent server logs
echo ""
echo "[INFO] Recent server logs:"
echo "==================================================================="
sleep 1

# Display the logs
echo "[INFO] Displaying live logs... Press Ctrl+C to exit."
echo ""

trap "kill $SERVER_PID; exit" INT
tail -f logs/server.log

exit 0