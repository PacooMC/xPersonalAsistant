import { NextRequest, NextResponse } from 'next/server';
import { SecureLogger, SecureErrorHandler, InputValidator } from '@/utils/security';

const RAPIDAPI_BASE_URL = 'https://twitter-v24.p.rapidapi.com';
const RAPIDAPI_HOST = 'twitter-v24.p.rapidapi.com';

export async function GET(request: NextRequest) {
  try {
    const apiKey = process.env.TWITTER_RAPIDAPI_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Twitter API not configured' },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');

    if (!username || !InputValidator.validateTwitterUsername(username)) {
      return NextResponse.json(
        { error: 'Invalid username parameter' },
        { status: 400 }
      );
    }

    const cleanUsername = username.replace('@', '');
    
    const response = await fetch(`${RAPIDAPI_BASE_URL}/user/details?username=${cleanUsername}`, {
      method: 'GET',
      headers: {
        'x-rapidapi-host': RAPIDAPI_HOST,
        'x-rapidapi-key': apiKey,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;
      
      switch (response.status) {
        case 401:
          errorMessage = 'Invalid API key configuration';
          break;
        case 429:
          errorMessage = 'API rate limit exceeded';
          break;
        case 403:
          errorMessage = 'Access forbidden';
          break;
        case 500:
          errorMessage = 'Twitter API server error';
          break;
      }
      
      return NextResponse.json(
        { error: errorMessage },
        { status: response.status }
      );
    }

    const data = await response.json();
    SecureLogger.apiResponse('/user/details', { status: 'success', username: cleanUsername });
    
    return NextResponse.json(data);
  } catch (error) {
    SecureErrorHandler.logError('Twitter user API', error);
    return NextResponse.json(
      { error: 'Failed to fetch user data' },
      { status: 500 }
    );
  }
} 