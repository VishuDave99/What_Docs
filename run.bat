@echo off
echo ===================================================================
echo                     DocChat AI Application
echo ===================================================================
echo.

echo [INFO] Checking prerequisites...

echo [INFO] Checking for Node.js...
where node >NUL 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js is required but not found.
    echo Please install Node.js from https://nodejs.org/
    echo.
    pause
    exit /b 1
)
echo [OK] Node.js found.

echo [INFO] Checking for npm...
where npm >NUL 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] npm is required but not found.
    echo Please install Node.js which includes npm.
    echo.
    pause
    exit /b 1
)
echo [OK] npm found.

echo [INFO] Checking for NVIDIA GPU...
where nvidia-smi >NUL 2>&1
if %ERRORLEVEL% neq 0 (
    echo [WARNING] NVIDIA GPU tools not found in PATH. Will run in CPU-only mode.
    echo To enable GPU acceleration, please install NVIDIA drivers.
) else (
    echo [INFO] Detecting NVIDIA GPU...
    for /f "tokens=*" %%a in ('nvidia-smi --query-gpu=name,driver_version --format=csv,noheader') do (
        echo [INFO] GPU detected: %%a
    )
    
    for /f "tokens=*" %%a in ('nvcc --version ^| findstr "release"') do (
        echo [INFO] CUDA Version: %%a
    )
    
    echo [OK] NVIDIA GPU setup complete.
)

echo [INFO] Checking for dependencies...
if not exist node_modules (
    echo [INFO] Installing dependencies. This may take a few minutes...
    call npm install
    if %ERRORLEVEL% neq 0 (
        echo [ERROR] Failed to install dependencies.
        echo.
        pause
        exit /b 1
    )
    echo [OK] Dependencies installed successfully.
) else (
    echo [OK] Dependencies already installed.
)

echo [INFO] Checking for uploads directory...
if not exist uploads (
    mkdir uploads
    echo [INFO] Created uploads directory.
)

echo [INFO] Starting the application...
echo [INFO] Browser will open automatically when the application starts.
echo [INFO] Press Ctrl+C to stop the application when done.
echo.

echo [INFO] Setting environment variables for GPU acceleration...
set NODE_OPTIONS=--max_old_space_size=8192
set OLLAMA_HOST=http://localhost:11434
set PORT=5000
set CUDA_VISIBLE_DEVICES=0
set TF_FORCE_GPU_ALLOW_GROWTH=true
set TF_GPU_ALLOCATOR=cuda_malloc_async
set OLLAMA_CUDA=1
set OLLAMA_GPU_LAYERS=-1
set OLLAMA_CUBLAS=1
set OLLAMA_VULKAN=1

echo [INFO] Launching application and browser...
timeout /t 2 >NUL 2>&1

echo [INFO] Starting application server...

:: Create logs directory if it doesn't exist
if not exist logs (
    mkdir logs
)

:: Start the server with output redirected to log file
start /b cmd /c "npm run dev > logs\server.log 2>&1"

:: Wait for server to start
echo [INFO] Waiting for server to start...
timeout /t 5 >NUL 2>&1

:: Open the browser
echo [INFO] Opening browser at http://localhost:5000
start "" http://localhost:5000

:: Show the most recent server logs
echo.
echo [INFO] Recent server logs:
echo ===================================================================
timeout /t 1 >NUL 2>&1

:: Display the logs in a loop so they stay updated
echo [INFO] Displaying live logs... Press Ctrl+C to exit.
echo.

:loop
type logs\server.log
timeout /t 3 >NUL 2>&1
cls
echo [INFO] DocChat AI Server Logs (refreshing every 3 seconds)
echo [INFO] Press Ctrl+C to exit
echo ===================================================================
echo.
goto loop

pause
exit /b 0