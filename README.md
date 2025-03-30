# DocChat AI - Document Chat Application

An offline document chat application with Ollama LLM integration, document management, and customizable AI settings.

## Features

- **Document Management**: Upload, select, and manage documents for context in AI conversations
- **Chat Interface**: Interact with the AI using the uploaded documents as context
- **Ollama Integration**: Utilizes Ollama's locally-run large language models for offline operation
- **Theme Support**: Multiple theme options including Default, Eco, Performance, and Overdrive themes
- **Text-to-Speech**: Convert AI responses to speech for accessibility
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Customizable Settings**: Configure model parameters, TTS options, and more
- **GPU Acceleration**: Enhanced performance on systems with NVIDIA GPUs

## Requirements

- Node.js (v16.0 or higher)
- Ollama installed and running (download from [ollama.ai](https://ollama.ai/download))
- At least one Ollama model downloaded (e.g., llama2, mistral, etc.)
- For GPU acceleration: NVIDIA GPU with compatible drivers

## Download & Installation Instructions

### Extracting the ZIP File
1. Download the DocChat AI zip file
2. Right-click the zip file and select "Extract All..." or use your preferred extraction tool
3. Select a destination folder for the extracted files
4. Click "Extract"

> **Note**: If you encounter extraction errors, try using 7-Zip or WinRAR as alternative extraction tools

## Quick Start

### Windows

1. Double-click `run.bat` to start the application
2. Navigate to http://localhost:3000 in your browser

### Linux/macOS

1. Make the script executable:
   ```
   chmod +x run.sh
   ```
2. Run the script:
   ```
   ./run.sh
   ```
3. Navigate to http://localhost:3000 in your browser

## Manual Setup

If the automatic scripts don't work, you can run the application manually:

1. Install dependencies:
   ```
   npm install
   ```

2. Make sure Ollama is running:
   ```
   ollama serve
   ```

3. Start the application:
   ```
   npm run dev
   ```

4. Navigate to http://localhost:3000 in your browser

## Using the Application

1. **Upload Documents**: Go to the Documents tab and upload your files
2. **Select Documents**: Click the "+" button on documents to select them for context
3. **Chat with AI**: Go to the Chat tab and start asking questions about your documents
4. **Adjust Settings**: Visit the Settings tab to configure model parameters and other options

## Supported Document Types

- Text files (.txt)
- PDF files (.pdf) 
- Word documents (.doc, .docx)
- Excel spreadsheets (.xls, .xlsx)
- PowerPoint presentations (.ppt, .pptx)
- Markdown files (.md)
- CSV files (.csv)
- RTF files (.rtf)

## Customizing Settings

In the Settings tab, you can configure:

- **Model Selection**: Choose which Ollama model to use
- **Temperature Profile**: Select from Default, Light, High, or Overdrive temperature profiles
- **Context Length**: Adjust how much previous conversation the AI considers
- **Chunk Size**: Configure document chunking for processing
- **Top-P Setting**: Adjust diversity of responses
- **Eco Mode**: Reduce resource usage for longer battery life
- **GPU Acceleration**: Enable/disable GPU support (if available)
- **Text-to-Speech**: Configure voice synthesis options

## Troubleshooting

- **Application won't start**: Check if port 3000 is already in use by another application
- **Can't connect to Ollama**: Ensure Ollama is running with `ollama serve`
- **No models shown**: Make sure you've downloaded at least one model with `ollama pull modelname`
- **Document upload fails**: Check if the uploads directory exists and has write permissions
- **Extraction fails**: If you encounter extraction issues:
  1. Try using 7-Zip or WinRAR instead of the built-in Windows extractor
  2. Make sure you have sufficient disk space
  3. Check for antivirus interference blocking the extraction
  4. Make sure you have write permissions in the destination folder
- **Run.bat not working**: If the batch file doesn't run:
  1. Right-click run.bat and select "Run as administrator" 
  2. Make sure Windows isn't blocking execution for security reasons
  3. Verify Node.js is installed and in your PATH

## License

This project is open source under the MIT License. See LICENSE file for details.

## Credits

- Uses Ollama for local LLM capabilities ([ollama.ai](https://ollama.ai))
- Built with React, Express, and Node.js
- UI components from shadcn/ui and Tailwind CSS
- Animations powered by Framer Motion