/**
 * Security utilities for X Personal Assistant
 * Provides secure logging, input validation, and API key management
 */

// Environment check
export const isProduction = process.env.NODE_ENV === 'production';
export const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * Secure logger that respects production environment
 * Prevents sensitive data from being logged in production
 */
export class SecureLogger {
  static log(message: string, data?: any) {
    if (isDevelopment) {
      const sanitizedData = data ? this.sanitizeForLogging(data) : '';
      console.log(`🔍 ${message}`, sanitizedData);
    }
  }

  private static sanitizeForLogging(data: any): string {
    if (!data) return '';
    const str = JSON.stringify(data, null, 2);
    // Remove potential API keys, tokens, and sensitive patterns
    return str
      .replace(/[a-zA-Z0-9]{20,}/g, '[REDACTED-LONG-STRING]')
      .replace(/(api[_-]?key|token|secret|password)[\s]*[:=][\s]*["']?[^"',\s}]+/gi, '$1: [REDACTED]')
      .replace(/(AIza|AKIA|sk_|pk_)[a-zA-Z0-9]+/g, '[REDACTED-API-KEY]');
  }

  static warn(message: string, data?: any) {
    if (isDevelopment) {
      console.warn(`⚠️ ${message}`, data);
    } else {
      // In production, only log minimal info
      console.warn(`⚠️ ${message}`);
    }
  }

  static error(message: string, error?: any) {
    if (isDevelopment) {
      console.error(`❌ ${message}`, error);
    } else {
      // In production, log errors but without sensitive details
      console.error(`❌ ${message}`, error?.message || 'Error occurred');
    }
  }

  static success(message: string, data?: any) {
    if (isDevelopment) {
      console.log(`✅ ${message}`, data);
    }
  }

  static apiResponse(endpoint: string, data: any) {
    if (isDevelopment) {
      const sanitizedData = this.sanitizeForLogging(data);
      console.log(`📡 API Response for ${endpoint}:`, sanitizedData);
    } else {
      console.log(`📡 API Response for ${endpoint}: [Data logged in development only]`);
    }
  }
}

/**
 * API Key utilities for secure handling
 */
export class ApiKeyManager {
  /**
   * Mask API key for logging (shows only first 8 characters)
   */
  static maskApiKey(apiKey: string): string {
    if (!apiKey) return '';
    return apiKey.length > 8 ? `${apiKey.substring(0, 8)}...` : '***';
  }

  /**
   * Validate API key format (basic validation)
   */
  static validateApiKeyFormat(apiKey: string): boolean {
    if (!apiKey || typeof apiKey !== 'string') return false;
    // Basic validation - should be at least 20 characters
    return apiKey.length >= 20;
  }

  /**
   * Sanitize API key (remove whitespace, validate format)
   */
  static sanitizeApiKey(apiKey: string): string {
    if (!apiKey) return '';
    return apiKey.trim();
  }
}

/**
 * Input validation utilities
 */
export class InputValidator {
  /**
   * Validate Twitter username
   */
  static validateTwitterUsername(username: string): boolean {
    if (!username || typeof username !== 'string') return false;
    // Remove @ if present and check format
    const cleanUsername = username.replace('@', '');
    return /^[a-zA-Z0-9_]{1,15}$/.test(cleanUsername);
  }

  /**
   * Sanitize user input to prevent XSS
   */
  static sanitizeInput(input: string): string {
    if (!input || typeof input !== 'string') return '';
    return input
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .substring(0, 1000); // Limit length
  }

  /**
   * Validate pagination parameters
   */
  static validatePaginationParams(count?: number, cursor?: string): { count: number; cursor?: string } {
    const safeCount = Math.min(Math.max(count || 20, 1), 100); // Between 1 and 100
    const safeCursor = cursor ? InputValidator.sanitizeInput(cursor) : undefined;
    return { count: safeCount, cursor: safeCursor };
  }
}

/**
 * Rate limiting utilities
 */
export class RateLimiter {
  private static requestCounts = new Map<string, { count: number; resetTime: number }>();
  
  /**
   * Check if request is within rate limits
   */
  static checkRateLimit(identifier: string, maxRequests: number = 60, windowMs: number = 60000): boolean {
    const now = Date.now();
    const current = this.requestCounts.get(identifier);
    
    // Reset if window has passed
    if (!current || now > current.resetTime) {
      this.requestCounts.set(identifier, { count: 1, resetTime: now + windowMs });
      return true;
    }
    
    // Check if under limit
    if (current.count < maxRequests) {
      current.count++;
      return true;
    }
    
    return false;
  }
  
  /**
   * Clean up old entries
   */
  static cleanup() {
    const now = Date.now();
    for (const [key, value] of this.requestCounts.entries()) {
      if (now > value.resetTime) {
        this.requestCounts.delete(key);
      }
    }
  }
}

/**
 * Error handling utilities
 */
export class SecureErrorHandler {
  /**
   * Create safe error response for API
   */
  static createSafeErrorResponse(error: any, defaultMessage: string = 'An error occurred') {
    if (isDevelopment) {
      return {
        message: error?.message || defaultMessage,
        stack: error?.stack,
        details: error
      };
    }
    
    // Production: Only return safe, generic messages
    return {
      message: defaultMessage,
      timestamp: new Date().toISOString()
    };
  }
  
  /**
   * Log error securely
   */
  static logError(context: string, error: any) {
    if (isDevelopment) {
      console.error(`❌ Error in ${context}:`, error);
    } else {
      console.error(`❌ Error in ${context}: ${error?.message || 'Unknown error'}`);
    }
  }
}

/**
 * Environment variable utilities
 */
export class EnvManager {
  /**
   * Get required environment variable with validation
   */
  static getRequired(key: string): string {
    const value = process.env[key];
    if (!value) {
      throw new Error(`Required environment variable ${key} is not set`);
    }
    return value;
  }
  
  /**
   * Get optional environment variable with default
   */
  static getOptional(key: string, defaultValue: string = ''): string {
    return process.env[key] || defaultValue;
  }
  
  /**
   * Check if all required environment variables are set
   */
  static validateRequiredEnvVars(requiredVars: string[]): { isValid: boolean; missing: string[] } {
    const missing = requiredVars.filter(key => !process.env[key]);
    return {
      isValid: missing.length === 0,
      missing
    };
  }
}

// Export default configuration
export const SECURITY_CONFIG = {
  API_RATE_LIMIT: 60, // requests per minute
  MAX_REQUEST_SIZE: 1024 * 1024, // 1MB
  SESSION_TIMEOUT: 24 * 60 * 60 * 1000, // 24 hours
  BCRYPT_ROUNDS: 12,
  JWT_ALGORITHM: 'HS256' as const,
  CORS_MAX_AGE: 86400, // 24 hours
  CSP_REPORT_URI: '/api/csp-report'
}; 