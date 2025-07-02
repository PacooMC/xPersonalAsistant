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
    const count = parseInt(searchParams.get('count') || '20', 10);
    const cursor = searchParams.get('cursor') || undefined;

    if (!username || !InputValidator.validateTwitterUsername(username)) {
      return NextResponse.json(
        { error: 'Invalid username parameter' },
        { status: 400 }
      );
    }

    const { count: safeCount, cursor: safeCursor } = InputValidator.validatePaginationParams(count, cursor);
    const cleanUsername = username.replace('@', '');
    
    const params = new URLSearchParams({
      username: cleanUsername,
      count: safeCount.toString(),
    });
    
    if (safeCursor) {
      params.append('cursor', safeCursor);
    }
    
    const response = await fetch(`${RAPIDAPI_BASE_URL}/user/tweets?${params.toString()}`, {
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
    SecureLogger.apiResponse('/user/tweets', { 
      status: 'success', 
      username: cleanUsername, 
      count: safeCount,
      hasCursor: !!safeCursor 
    });
    
    return NextResponse.json(data);
  } catch (error) {
    SecureErrorHandler.logError('Twitter tweets API', error);
    return NextResponse.json(
      { error: 'Failed to fetch tweets' },
      { status: 500 }
    );
  }
} 