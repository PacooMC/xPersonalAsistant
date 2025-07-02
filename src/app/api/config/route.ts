import { NextRequest, NextResponse } from 'next/server';
import { SecureLogger, ApiKeyManager, InputValidator, RateLimiter, EnvManager } from '@/utils/security';

// Security configuration - REMOVED dangerous default value
const CONFIG_SECRET = process.env.CONFIG_SECRET;
if (!CONFIG_SECRET) {
  throw new Error('CONFIG_SECRET environment variable is required for production deployment');
}

const RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT_MAX || '10', 10); // 10 requests
const RATE_LIMIT_WINDOW = parseInt(process.env.RATE_LIMIT_WINDOW || '300000', 10); // 5 minutes

// Configuration schema for validation
interface ConfigData {
  twitterApiKey?: string;
  geminiApiKey?: string;
  username?: string;
  appSettings?: {
    theme?: 'light' | 'dark' | 'auto';
    language?: 'en' | 'es';
    notifications?: boolean;
  };
}

// Validate configuration data
function validateConfigData(data: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (data.twitterApiKey && !ApiKeyManager.validateApiKeyFormat(data.twitterApiKey)) {
    errors.push('Invalid Twitter API key format');
  }

  if (data.geminiApiKey && !ApiKeyManager.validateApiKeyFormat(data.geminiApiKey)) {
    errors.push('Invalid Gemini API key format');
  }

  if (data.username && !InputValidator.validateTwitterUsername(data.username)) {
    errors.push('Invalid Twitter username format');
  }

  if (data.appSettings) {
    const { theme, language, notifications } = data.appSettings;
    
    if (theme && !['light', 'dark', 'auto'].includes(theme)) {
      errors.push('Invalid theme value');
    }
    
    if (language && !['en', 'es'].includes(language)) {
      errors.push('Invalid language value');
    }
    
    if (notifications !== undefined && typeof notifications !== 'boolean') {
      errors.push('Invalid notifications value');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// Get client IP for rate limiting
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const real = request.headers.get('x-real-ip');
  
  return forwarded?.split(',')[0] || real || 'unknown';
}

// POST - Save configuration
export async function POST(request: NextRequest) {
  try {
    const clientIP = getClientIP(request);
    
    // Rate limiting
    if (!RateLimiter.checkRateLimit(clientIP, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW)) {
      SecureLogger.warn(`Rate limit exceeded for IP: ${clientIP}`);
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }

    // Validate authentication header
    const authHeader = request.headers.get('authorization');
    const expectedAuth = `Bearer ${CONFIG_SECRET}`;
    
    if (!authHeader || authHeader !== expectedAuth) {
      SecureLogger.warn(`Unauthorized config access attempt from IP: ${clientIP}`);
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const { isValid, errors } = validateConfigData(body);
    
    if (!isValid) {
      SecureLogger.warn('Invalid configuration data submitted', { errors });
      return NextResponse.json(
        { error: 'Invalid configuration data', details: errors },
        { status: 400 }
      );
    }

    // Sanitize sensitive data for logging
    const sanitizedBody = {
      ...body,
      twitterApiKey: body.twitterApiKey ? ApiKeyManager.maskApiKey(body.twitterApiKey) : undefined,
      geminiApiKey: body.geminiApiKey ? ApiKeyManager.maskApiKey(body.geminiApiKey) : undefined,
    };

    SecureLogger.log('Configuration saved successfully', sanitizedBody);

    // In a real application, you would save this to a secure database
    // For now, we'll just return success
    return NextResponse.json({ 
      success: true,
      message: 'Configuration saved successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    SecureLogger.error('Error saving configuration', error);
    return NextResponse.json(
      { error: 'Failed to save configuration' },
      { status: 500 }
    );
  }
}

// GET - Get configuration status (without sensitive data)
export async function GET(request: NextRequest) {
  try {
    const clientIP = getClientIP(request);
    
    // Rate limiting
    if (!RateLimiter.checkRateLimit(clientIP, RATE_LIMIT_MAX * 2, RATE_LIMIT_WINDOW)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    // Return configuration status without sensitive data
    const status = {
      hasTwitterApiKey: !!process.env.TWITTER_RAPIDAPI_KEY,
      hasGeminiApiKey: !!process.env.GEMINI_API_KEY,
      environment: process.env.NODE_ENV,
      appUrl: process.env.NEXT_PUBLIC_APP_URL || 'not configured',
      version: '1.0.0',
      timestamp: new Date().toISOString()
    };

    SecureLogger.log('Configuration status requested', { 
      hasTwitterApiKey: status.hasTwitterApiKey,
      hasGeminiApiKey: status.hasGeminiApiKey 
    });

    return NextResponse.json(status);

  } catch (error) {
    SecureLogger.error('Error getting configuration status', error);
    return NextResponse.json(
      { error: 'Failed to get configuration status' },
      { status: 500 }
    );
  }
}

// PUT - Update specific configuration values
export async function PUT(request: NextRequest) {
  try {
    const clientIP = getClientIP(request);
    
    // Rate limiting
    if (!RateLimiter.checkRateLimit(clientIP, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    // Validate authentication
    const authHeader = request.headers.get('authorization');
    const expectedAuth = `Bearer ${CONFIG_SECRET}`;
    
    if (!authHeader || authHeader !== expectedAuth) {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { field, value } = body;

    // Validate field and value
    const allowedFields = ['theme', 'language', 'notifications', 'username'];
    if (!field || !allowedFields.includes(field)) {
      return NextResponse.json(
        { error: 'Invalid field specified' },
        { status: 400 }
      );
    }

    // Validate specific field values
    if (field === 'username' && !InputValidator.validateTwitterUsername(value)) {
      return NextResponse.json(
        { error: 'Invalid username format' },
        { status: 400 }
      );
    }

    SecureLogger.log(`Configuration field updated: ${field}`, { field, hasValue: !!value });

    return NextResponse.json({ 
      success: true,
      message: `${field} updated successfully`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    SecureLogger.error('Error updating configuration', error);
    return NextResponse.json(
      { error: 'Failed to update configuration' },
      { status: 500 }
    );
  }
}

// DELETE - Clear configuration (admin only)
export async function DELETE(request: NextRequest) {
  try {
    const clientIP = getClientIP(request);
    
    // Stricter rate limiting for delete operations
    if (!RateLimiter.checkRateLimit(clientIP, 3, RATE_LIMIT_WINDOW)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    // Validate authentication
    const authHeader = request.headers.get('authorization');
    const expectedAuth = `Bearer ${CONFIG_SECRET}`;
    
    if (!authHeader || authHeader !== expectedAuth) {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 401 }
      );
    }

    // Additional confirmation required for delete
    const body = await request.json();
    if (body.confirm !== 'DELETE_ALL_CONFIG') {
      return NextResponse.json(
        { error: 'Delete confirmation required' },
        { status: 400 }
      );
    }

    SecureLogger.warn('Configuration cleared by admin', { clientIP });

    return NextResponse.json({ 
      success: true,
      message: 'Configuration cleared successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    SecureLogger.error('Error clearing configuration', error);
    return NextResponse.json(
      { error: 'Failed to clear configuration' },
      { status: 500 }
    );
  }
} 