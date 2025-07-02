import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { SecureLogger, ApiKeyManager, InputValidator, RateLimiter, SecureErrorHandler } from '@/utils/security';

const MODEL_NAME = 'gemini-2.0-flash';
const MAX_TWEETS_ANALYZE = 20;
const MAX_MESSAGE_LENGTH = 2000;

// Rate limiting configuration
const RATE_LIMIT_MAX = 30; // requests per window
const RATE_LIMIT_WINDOW = 60000; // 1 minute

// Get client IP for rate limiting
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const real = request.headers.get('x-real-ip');
  
  return forwarded?.split(',')[0] || real || 'unknown';
}

// Validate request action
function validateAction(action: string): boolean {
  const allowedActions = ['test', 'analyze', 'chat'];
  return allowedActions.includes(action);
}

// Sanitize and validate analysis data
function validateAnalysisData(data: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.tweets || !Array.isArray(data.tweets)) {
    errors.push('Tweets array is required');
  } else if (data.tweets.length === 0) {
    errors.push('At least one tweet is required');
  } else if (data.tweets.length > MAX_TWEETS_ANALYZE) {
    errors.push(`Maximum ${MAX_TWEETS_ANALYZE} tweets allowed`);
  }

  if (!data.user || typeof data.user !== 'object') {
    errors.push('User object is required');
  } else {
    if (!data.user.username || !InputValidator.validateTwitterUsername(data.user.username)) {
      errors.push('Valid username is required');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// Sanitize chat data
function validateChatData(data: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.message || typeof data.message !== 'string') {
    errors.push('Message is required');
  } else {
    const sanitized = InputValidator.sanitizeInput(data.message);
    if (sanitized.length === 0) {
      errors.push('Message cannot be empty after sanitization');
    } else if (sanitized.length > MAX_MESSAGE_LENGTH) {
      errors.push(`Message too long (max ${MAX_MESSAGE_LENGTH} characters)`);
    }
  }

  if (data.context && typeof data.context !== 'string') {
    errors.push('Context must be a string');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

export async function POST(request: NextRequest) {
  try {
    const clientIP = getClientIP(request);
    
    // Rate limiting
    if (!RateLimiter.checkRateLimit(clientIP, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW)) {
      SecureLogger.warn(`Rate limit exceeded for Gemini API from IP: ${clientIP}`);
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { action, data, apiKey } = body;

    // Validate action
    if (!validateAction(action)) {
      SecureLogger.warn(`Invalid action attempted: ${action}`, { clientIP });
      return NextResponse.json(
        { error: 'Invalid action specified' },
        { status: 400 }
      );
    }

    // Use environment variable if available, otherwise use provided API key
    const geminiApiKey = process.env.GEMINI_API_KEY || apiKey;
    
    if (!geminiApiKey) {
      SecureLogger.warn('Gemini API key not configured', { clientIP, action });
      return NextResponse.json(
        { error: 'Gemini API key not configured' },
        { status: 400 }
      );
    }

    // Validate API key format
    if (!ApiKeyManager.validateApiKeyFormat(geminiApiKey)) {
      SecureLogger.warn('Invalid Gemini API key format', { clientIP });
      return NextResponse.json(
        { error: 'Invalid API key format' },
        { status: 400 }
      );
    }

    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    SecureLogger.log(`Processing ${action} request`, { 
      clientIP, 
      action,
      hasApiKey: !!geminiApiKey,
      keyMasked: ApiKeyManager.maskApiKey(geminiApiKey)
    });

    switch (action) {
      case 'test':
        const testResult = await model.generateContent("Test connection. Reply with 'OK'");
        const testResponse = await testResult.response;
        
        SecureLogger.success('Gemini connection test completed', { clientIP });
        
        return NextResponse.json({ 
          success: testResponse.text().includes('OK'),
          message: testResponse.text()
        });

      case 'analyze':
        // Validate analysis data
        const analysisValidation = validateAnalysisData(data);
        if (!analysisValidation.isValid) {
          SecureLogger.warn('Invalid analysis data', { clientIP, errors: analysisValidation.errors });
          return NextResponse.json(
            { error: 'Invalid analysis data', details: analysisValidation.errors },
            { status: 400 }
          );
        }

        const { tweets, user } = data;
        const sanitizedTweets = tweets
          .slice(0, MAX_TWEETS_ANALYZE)
          .map((t: any) => InputValidator.sanitizeInput(t.text || ''))
          .filter((text: string) => text.length > 0);
        
        if (sanitizedTweets.length === 0) {
          return NextResponse.json(
            { error: 'No valid tweets to analyze' },
            { status: 400 }
          );
        }

        const prompt = `
Analyze the writing style of @${InputValidator.sanitizeInput(user.username)} based on these tweets:

PROFILE:
- Name: ${InputValidator.sanitizeInput(user.name || '')}
- Bio: ${InputValidator.sanitizeInput(user.description || '')}
- Followers: ${Math.max(0, parseInt(user.public_metrics?.followers_count || '0', 10))}

TWEETS (${sanitizedTweets.length} tweets):
${sanitizedTweets.map((tweet: string, i: number) => `${i + 1}. "${tweet}"`).join('\n')}

Please provide a detailed writing style analysis in JSON format with this exact structure:

{
  "overall_tone": "description of general tone (professional, casual, technical, etc.)",
  "writing_style": "description of writing style",
  "common_topics": ["topic1", "topic2", "topic3"],
  "language_patterns": ["pattern1", "pattern2", "pattern3"],
  "emotional_sentiment": "predominant emotional sentiment",
  "engagement_level": "engagement level (high/medium/low)",
  "suggestions": ["suggestion1", "suggestion2", "suggestion3"],
  "score": number_between_1_and_100
}

Respond ONLY with valid JSON, no additional text.
`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        const cleanText = text.replace(/```json|```/g, '').trim();
        
        try {
          const analysis = JSON.parse(cleanText);
          SecureLogger.success('Style analysis completed', { 
            clientIP, 
            username: user.username,
            tweetsAnalyzed: sanitizedTweets.length 
          });
          return NextResponse.json({ analysis });
        } catch (parseError) {
          SecureLogger.error('Failed to parse analysis JSON', parseError);
          return NextResponse.json(
            { error: 'Failed to parse analysis response' },
            { status: 500 }
          );
        }

      case 'chat':
        // Validate chat data
        const chatValidation = validateChatData(data);
        if (!chatValidation.isValid) {
          SecureLogger.warn('Invalid chat data', { clientIP, errors: chatValidation.errors });
          return NextResponse.json(
            { error: 'Invalid chat data', details: chatValidation.errors },
            { status: 400 }
          );
        }

        const { message, context } = data;
        const sanitizedMessage = InputValidator.sanitizeInput(message);
        const sanitizedContext = context ? InputValidator.sanitizeInput(context) : undefined;
        
        let chatPrompt = sanitizedMessage;
        
        if (sanitizedContext) {
          chatPrompt = `
CONTEXT: ${sanitizedContext}

USER QUESTION: ${sanitizedMessage}

Please respond in English in a helpful and conversational manner.
`;
        }

        const chatResult = await model.generateContent(chatPrompt);
        const chatResponse = await chatResult.response;
        const content = chatResponse.text();

        const usage = chatResponse.usageMetadata ? {
          promptTokens: chatResponse.usageMetadata.promptTokenCount || 0,
          candidateTokens: chatResponse.usageMetadata.candidatesTokenCount || 0,
          totalTokens: chatResponse.usageMetadata.totalTokenCount || 0,
        } : undefined;

        SecureLogger.success('Chat response generated', { 
          clientIP, 
          messageLength: sanitizedMessage.length,
          hasContext: !!sanitizedContext 
        });

        return NextResponse.json({ 
          content,
          usage
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    const clientIP = getClientIP(request);
    SecureErrorHandler.logError('Gemini API error', error);
    
    // Return safe error response
    const safeError = SecureErrorHandler.createSafeErrorResponse(
      error, 
      'Failed to process request'
    );
    
    return NextResponse.json(
      { error: safeError.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    SecureLogger.log('Gemini API status check');
    
    return NextResponse.json({ 
      status: 'Gemini API endpoint active',
      configured: !!process.env.GEMINI_API_KEY,
      model: MODEL_NAME,
      version: '1.0.0',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    SecureErrorHandler.logError('Gemini API status check error', error);
    
    return NextResponse.json(
      { error: 'Failed to get status' },
      { status: 500 }
    );
  }
}