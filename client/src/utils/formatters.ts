/**
 * Format file size in bytes to a readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

/**
 * Format date string or Date object to relative time (today, yesterday, x days ago)
 */
export function formatRelativeTime(dateInput: string | Date): string {
  // Convert to Date object if it's a string
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  const now = new Date();
  
  const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffInDays === 0) {
    return 'Added today';
  } else if (diffInDays === 1) {
    return 'Added yesterday';
  } else {
    return `Added ${diffInDays} days ago`;
  }
}

/**
 * Get icon class based on file type
 */
export function getFileIcon(fileType: string): string {
  const type = fileType.toLowerCase();
  
  if (type.includes('pdf')) {
    return 'ri-file-pdf-line text-error';
  } else if (type.includes('doc') || type.includes('word')) {
    return 'ri-file-word-line text-primary';
  } else if (type.includes('xls') || type.includes('excel') || type.includes('sheet')) {
    return 'ri-file-excel-line text-success';
  } else if (type.includes('ppt') || type.includes('powerpoint')) {
    return 'ri-file-ppt-line text-warning';
  } else if (type.includes('txt')) {
    return 'ri-file-text-line text-warning';
  } else if (type.includes('md') || type.includes('markdown')) {
    return 'ri-markdown-line text-primary';
  } else {
    return 'ri-file-line text-muted';
  }
}

/**
 * Format value with units
 */
export function formatWithUnits(value: number | string, unit: string = ''): string {
  return `${value}${unit}`;
}
