import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import { log } from './vite';
import { Document } from '@shared/schema';

// Set up paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOADS_DIR = path.join(__dirname, '../uploads');

// Ensure uploads directory exists
async function ensureUploadsDir() {
  try {
    await fs.mkdir(UPLOADS_DIR, { recursive: true });
  } catch (error) {
    console.error('Error creating uploads directory:', error);
  }
}

// Initialize uploads directory
ensureUploadsDir();

/**
 * Save an uploaded file to disk
 * @param file Express file upload
 * @returns Promise<{path: string, filename: string, filesize: number, filetype: string}>
 */
export async function saveUploadedFile(file: Express.Multer.File): Promise<{
  path: string;
  filename: string;
  filesize: number;
  filetype: string;
}> {
  // Generate unique filename
  const originalName = file.originalname;
  const ext = path.extname(originalName);
  const uniqueId = uuidv4();
  const filename = `${path.basename(originalName, ext)}_${uniqueId}${ext}`;
  
  // Create full path
  const filePath = path.join(UPLOADS_DIR, filename);
  
  try {
    // Write file to disk
    await fs.writeFile(filePath, file.buffer);
    
    log(`File saved: ${filename}`, 'documents');
    
    return {
      path: filePath,
      filename: originalName,
      filesize: file.size,
      filetype: file.mimetype,
    };
  } catch (error) {
    console.error('Error saving file:', error);
    throw new Error('Failed to save the uploaded file');
  }
}

/**
 * Delete a document file from disk
 * @param filePath Path to the file
 * @returns Promise<boolean>
 */
export async function deleteDocumentFile(filePath: string): Promise<boolean> {
  try {
    await fs.unlink(filePath);
    log(`File deleted: ${path.basename(filePath)}`, 'documents');
    return true;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
}

/**
 * Extract content from a document (simple text extraction)
 * @param filePath Path to the file
 * @returns Promise<string>
 */
export async function extractDocumentContent(filePath: string): Promise<string> {
  try {
    // For now, we'll just read text files directly
    // In a real implementation, we would use libraries like pdf-parse for PDFs,
    // mammoth for Word docs, etc.
    const ext = path.extname(filePath).toLowerCase();
    
    if (ext === '.txt' || ext === '.md') {
      const content = await fs.readFile(filePath, 'utf-8');
      return content;
    }
    
    // For other file types, just return a placeholder
    // In a real implementation, we would use appropriate libraries
    return 'Document content extraction not implemented for this file type yet.';
  } catch (error) {
    console.error('Error extracting document content:', error);
    return '';
  }
}

/**
 * Check if a file is of an allowed type
 * @param mimetype File MIME type
 * @returns boolean
 */
export function isAllowedFileType(mimetype: string): boolean {
  const allowedTypes = [
    'application/pdf',
    'text/plain',
    'text/markdown',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/csv'
  ];
  
  return allowedTypes.includes(mimetype);
}
