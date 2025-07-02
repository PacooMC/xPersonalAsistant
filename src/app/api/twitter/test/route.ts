import { NextResponse } from 'next/server';
import { SecureLogger, SecureErrorHandler } from '@/utils/security';

const RAPIDAPI_BASE_URL = 'https://twitter-v24.p.rapidapi.com';
const RAPIDAPI_HOST = 'twitter-v24.p.rapidapi.com';

export async function GET() {
  try {
    const apiKey = process.env.TWITTER_RAPIDAPI_KEY;
    
    if (!apiKey) {
      SecureLogger.warn('Twitter API key not configured');
      return NextResponse.json(
        { error: 'Twitter API not configured' },
        { status: 500 }
      );
    }

    // Test connection with a safe endpoint
    const response = await fetch(`${RAPIDAPI_BASE_URL}/user/details?username=twitter`, {
      method: 'GET',
      headers: {
        'x-rapidapi-host': RAPIDAPI_HOST,
        'x-rapidapi-key': apiKey,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      SecureLogger.success('Twitter API connection test successful');
      return NextResponse.json({ status: 'connected' });
    } else {
      SecureLogger.warn('Twitter API connection test failed', { status: response.status });
      return NextResponse.json(
        { error: 'API connection failed' },
        { status: response.status }
      );
    }
  } catch (error) {
    SecureErrorHandler.logError('Twitter API test', error);
    return NextResponse.json(
      { error: 'Connection test failed' },
      { status: 500 }
    );
  }
} 