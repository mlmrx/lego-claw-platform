/**
 * Input Sanitization Utilities
 * 
 * Security utilities to sanitize user input and prevent XSS/injection attacks.
 */

/**
 * Sanitize HTML entities to prevent XSS
 */
export function escapeHtml(str: string): string {
  const htmlEntities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;',
  };
  return str.replace(/[&<>"'`=/]/g, (char) => htmlEntities[char] || char);
}

/**
 * Remove potentially dangerous characters from strings
 */
export function sanitizeString(str: string): string {
  // Remove null bytes and control characters (except newlines and tabs)
  return str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
}

/**
 * Sanitize URL to prevent javascript: and data: protocols
 */
export function sanitizeUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

/**
 * Validate and sanitize email addresses
 */
export function sanitizeEmail(email: string): string | null {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const sanitized = email.trim().toLowerCase();
  return emailRegex.test(sanitized) ? sanitized : null;
}

/**
 * Sanitize object keys to prevent prototype pollution
 */
export function sanitizeObjectKeys<T extends Record<string, unknown>>(obj: T): T {
  const dangerous = ['__proto__', 'constructor', 'prototype'];
  const result = {} as T;
  
  for (const [key, value] of Object.entries(obj)) {
    if (!dangerous.includes(key)) {
      result[key as keyof T] = value as T[keyof T];
    }
  }
  
  return result;
}

/**
 * Sanitize SQL-like patterns (for logging, not for actual SQL - use parameterized queries)
 */
export function sanitizeForLogging(str: string): string {
  // Remove potential SQL injection patterns for safe logging
  return str
    .replace(/--/g, '')
    .replace(/;/g, '')
    .replace(/'/g, "''")
    .slice(0, 1000); // Limit length
}

/**
 * Validate hex color codes
 */
export function isValidHexColor(color: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(color);
}

/**
 * Sanitize file names to prevent path traversal
 */
export function sanitizeFileName(fileName: string): string {
  return fileName
    .replace(/\.\./g, '') // Remove path traversal
    .replace(/[/\\]/g, '') // Remove path separators
    .replace(/[<>:"|?*]/g, '') // Remove invalid characters
    .slice(0, 255); // Limit length
}
