/**
 * Text-to-Speech utilities
 * 
 * Note: This file provides the server-side TTS API interfaces.
 * The actual TTS is implemented client-side using the Web Speech API.
 */

import { log } from './vite';

/**
 * Check if text content is suitable for TTS
 * @param text Text to validate
 * @returns boolean
 */
export function validateTtsContent(text: string): boolean {
  // Basic validation
  if (!text || typeof text !== 'string') {
    return false;
  }
  
  // Check length (most TTS services have limits)
  if (text.length > 5000) {
    return false;
  }
  
  return true;
}

/**
 * Format text for TTS by removing markdown, code blocks, etc.
 * @param text Text to format
 * @returns Formatted text
 */
export function formatTextForTts(text: string): string {
  // Remove markdown formatting
  let formatted = text
    // Remove code blocks
    .replace(/```[\s\S]*?```/g, 'Code block omitted.')
    // Remove inline code
    .replace(/`([^`]+)`/g, '$1')
    // Replace bullet points
    .replace(/^\s*[-*]\s+/gm, 'Bullet point: ')
    // Replace headings
    .replace(/^#{1,6}\s+(.+)$/gm, '$1')
    // Remove URLs but keep link text
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
    // Remove horizontal rules
    .replace(/^\s*[-*=_]{3,}\s*$/gm, '')
    // Replace multiple newlines with a single one
    .replace(/\n{3,}/g, '\n\n');
  
  return formatted;
}

/**
 * Log TTS usage for analytics
 * @param text Text that was converted
 * @param options TTS options used
 */
export function logTtsUsage(text: string, options: { voice: string, rate: number }): void {
  const textPreview = text.length > 50 ? `${text.substring(0, 50)}...` : text;
  log(`TTS requested: "${textPreview}" (Voice: ${options.voice}, Rate: ${options.rate})`, 'tts');
}
