import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import { log } from './vite';

/**
 * Error logging utility
 * @param error Error to log
 * @param req Express request object
 * @param type Error type/category
 */
export function logError(error: Error, req: Request, type: string = 'general'): void {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.originalUrl || req.url;
  const userAgent = req.headers['user-agent'] || 'unknown';
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  
  const logEntry = `[${timestamp}] [${type.toUpperCase()}] ${method} ${url}
    Error: ${error.message}
    Stack: ${error.stack}
    IP: ${ip}
    User-Agent: ${userAgent}
    Body: ${JSON.stringify(req.body || {})}
    Query: ${JSON.stringify(req.query || {})}
    -------------------\n`;
  
  // Ensure logs directory exists
  const logsDir = path.join(process.cwd(), 'logs');
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
  
  // Write to log file (append)
  fs.appendFile(path.join(logsDir, 'error.log'), logEntry, (err) => {
    if (err) {
      console.error('Failed to write to error log:', err);
    }
  });
  
  // Also log to console
  log(`Error (${type}): ${error.message}`, 'error');
}

/**
 * Global error handler middleware
 */
export function errorHandler(err: any, req: Request, res: Response, next: NextFunction): void {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  
  // Log error
  logError(err, req, err.type || 'server');
  
  // Send error response
  res.status(statusCode).json({
    error: message,
    status: statusCode,
    timestamp: new Date().toISOString()
  });
}

/**
 * Custom error class with status code
 */
export class AppError extends Error {
  statusCode: number;
  type: string;
  
  constructor(message: string, statusCode: number = 500, type: string = 'general') {
    super(message);
    this.statusCode = statusCode;
    this.type = type;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Handle uncaught exceptions and unhandled rejections
 */
export function setupGlobalErrorHandlers(): void {
  process.on('uncaughtException', (error) => {
    console.error('UNCAUGHT EXCEPTION:', error);
    
    // Write to log file
    const logsDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    
    const logEntry = `[${new Date().toISOString()}] [UNCAUGHT EXCEPTION]
      Error: ${error.message}
      Stack: ${error.stack}
      -------------------\n`;
      
    fs.appendFileSync(path.join(logsDir, 'fatal.log'), logEntry);
    
    // Exit with error
    process.exit(1);
  });
  
  process.on('unhandledRejection', (reason, promise) => {
    console.error('UNHANDLED REJECTION:', reason);
    
    // Write to log file
    const logsDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    
    const logEntry = `[${new Date().toISOString()}] [UNHANDLED REJECTION]
      Reason: ${reason}
      -------------------\n`;
      
    fs.appendFileSync(path.join(logsDir, 'fatal.log'), logEntry);
  });
}