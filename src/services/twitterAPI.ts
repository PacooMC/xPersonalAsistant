import { Tweet, TwitterUser, TwitterAPIResponse, APIError } from '@/types/twitter';
import { SecureLogger, ApiKeyManager, InputValidator, SecureErrorHandler } from '@/utils/security';

const RAPIDAPI_BASE_URL = 'https://twitter-v24.p.rapidapi.com';
const RAPIDAPI_HOST = 'twitter-v24.p.rapidapi.com';

class TwitterAPIService {
  private static instance: TwitterAPIService;
  private apiKey: string;
  private isClientSide: boolean;
  
  private constructor() {
    // Detect if we're on client-side or server-side
    this.isClientSide = typeof window !== 'undefined';
    
    // SECURITY FIX: Never use process.env on client-side
    this.apiKey = '';
    
    if (!this.isClientSide) {
      // Only access environment variables on server-side
      this.apiKey = process.env.TWITTER_RAPIDAPI_KEY || '';
      if (!this.apiKey) {
        SecureLogger.warn('TWITTER_RAPIDAPI_KEY not found in environment variables');
      } else {
        SecureLogger.success('Twitter API service initialized with environment variables');
      }
    } else {
      SecureLogger.success('Twitter API service initialized (client-side)');
    }
  }

  public static getInstance(): TwitterAPIService {
    if (!TwitterAPIService.instance) {
      TwitterAPIService.instance = new TwitterAPIService();
    }
    return TwitterAPIService.instance;
  }

  // Update configuration
  public updateConfig(config: { apiKey: string }) {
    if (config.apiKey && ApiKeyManager.validateApiKeyFormat(config.apiKey)) {
      this.apiKey = ApiKeyManager.sanitizeApiKey(config.apiKey);
    }
  }

  // Get current API key (masked for security)
  public getCurrentApiKey(): string {
    return ApiKeyManager.maskApiKey(this.apiKey);
  }

  private async makeRequest<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
    const url = new URL(`${RAPIDAPI_BASE_URL}${endpoint}`);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }

    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'x-rapidapi-host': RAPIDAPI_HOST,
          'x-rapidapi-key': this.apiKey,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        
        switch (response.status) {
          case 401:
            errorMessage = 'Invalid API key. Please check your Twitter RapidAPI key configuration.';
            break;
          case 429:
            errorMessage = 'API rate limit exceeded. Please wait before making more requests or upgrade your RapidAPI plan.';
            break;
          case 403:
            errorMessage = 'Access forbidden. Please check your API key permissions.';
            break;
          case 500:
            errorMessage = 'Twitter API server error. Please try again later.';
            break;
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      SecureLogger.apiResponse(endpoint, data);
      return data;
    } catch (error) {
      SecureErrorHandler.logError(`API request for ${endpoint}`, error);
      throw new APIError({
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        status: error instanceof Response ? error.status : undefined,
      });
    }
  }

  // Get user profile by username - CONFIRMED WORKING
  async getUserByUsername(username: string): Promise<TwitterUser> {
    try {
      if (!InputValidator.validateTwitterUsername(username)) {
        throw new APIError({
          message: 'Invalid Twitter username format',
          status: 400,
        });
      }

      const cleanUsername = username.replace('@', '');
      
      // Use backend API for client-side or when no direct API access
      if (this.isClientSide || !this.apiKey) {
        const response = await fetch(`/api/twitter/user?username=${cleanUsername}`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new APIError({
            message: errorData.error || 'Failed to fetch user',
            status: response.status,
          });
        }
        const data = await response.json();
        return this.parseUserData(data);
      }
      
      // Server-side with direct API access
      const response = await this.makeRequest<any>(`/user/details`, {
        username: cleanUsername
      });
      
      return this.parseUserData(response);
    } catch (error) {
      throw new APIError({
        message: `Failed to fetch user ${username}`,
        status: error instanceof APIError ? error.status : undefined,
      });
    }
  }

  // Get user tweets - CONFIRMED WORKING with /user/tweets endpoint
  async getUserTweets(username: string, count: number = 20): Promise<Tweet[]> {
    try {
      if (!InputValidator.validateTwitterUsername(username)) {
        throw new APIError({
          message: 'Invalid Twitter username format',
          status: 400,
        });
      }

      const { count: safeCount } = InputValidator.validatePaginationParams(count);
      const cleanUsername = username.replace('@', '');
      
      // Use the confirmed working endpoint
      const response = await this.makeRequest<any>(`/user/tweets`, {
        username: cleanUsername,
        count: safeCount.toString(),
      });
      
      return this.parseTweetsData(response);
    } catch (error) {
      throw new APIError({
        message: `Failed to fetch tweets for ${username}`,
        status: error instanceof APIError ? error.status : undefined,
      });
    }
  }

  // NEW: Get user tweets with cursor pagination support
  async getUserTweetsWithCursor(username: string, count: number = 20, cursor?: string): Promise<{
    tweets: Tweet[];
    user: TwitterUser | null;
    nextCursor: string | null;
    hasMore: boolean;
  }> {
    try {
      if (!InputValidator.validateTwitterUsername(username)) {
        throw new APIError({
          message: 'Invalid Twitter username format',
          status: 400,
        });
      }

      const { count: safeCount, cursor: safeCursor } = InputValidator.validatePaginationParams(count, cursor);
      const cleanUsername = username.replace('@', '');
      
      // Use backend API for client-side or when no direct API access
      if (this.isClientSide || !this.apiKey) {
        const params = new URLSearchParams({
          username: cleanUsername,
          count: safeCount.toString(),
        });
        
        if (safeCursor) {
          params.append('cursor', safeCursor);
        }
        
        // Get tweets from backend API
        const tweetsResponse = await fetch(`/api/twitter/tweets?${params.toString()}`);
        if (!tweetsResponse.ok) {
          const errorData = await tweetsResponse.json();
          throw new APIError({
            message: errorData.error || 'Failed to fetch tweets',
            status: tweetsResponse.status,
          });
        }
        const tweetsData = await tweetsResponse.json();
        const tweets = this.parseTweetsData(tweetsData);
        const nextCursor = this.extractNextCursor(tweetsData);
        
        // Get user profile from backend API
        let user: TwitterUser | null = null;
        try {
          const userResponse = await fetch(`/api/twitter/user?username=${cleanUsername}`);
          if (userResponse.ok) {
            const userData = await userResponse.json();
            user = this.parseUserData(userData);
          }
        } catch (userError) {
          SecureLogger.warn('Failed to fetch user profile, continuing with tweets only', userError);
        }
        
        return {
          tweets,
          user,
          nextCursor,
          hasMore: !!nextCursor && tweets.length > 0
        };
      }
      
      // Server-side with direct API access - original implementation
      const params: Record<string, string> = {
        username: cleanUsername,
        count: safeCount.toString(),
      };
      
      if (safeCursor) {
        params.cursor = safeCursor;
      }
      
      // Get tweets from /user/tweets endpoint
      const tweetsResponse = await this.makeRequest<any>(`/user/tweets`, params);
      const tweets = this.parseTweetsData(tweetsResponse);
      const nextCursor = this.extractNextCursor(tweetsResponse);
      
      // Get user profile from /user/details endpoint (separate call)
      let user: TwitterUser | null = null;
      try {
        SecureLogger.log('Making separate call to get user profile...');
        const userResponse = await this.makeRequest<any>(`/user/details`, {
          username: cleanUsername
        });
        user = this.parseUserData(userResponse);
        SecureLogger.success('Successfully parsed user profile', {
          name: user.name,
          username: user.username,
          followers: user.public_metrics?.followers_count
        });
      } catch (userError) {
        SecureLogger.warn('Failed to fetch user profile, continuing with tweets only', userError);
      }
      
      return {
        tweets,
        user,
        nextCursor,
        hasMore: !!nextCursor && tweets.length > 0
      };
    } catch (error) {
      throw new APIError({
        message: `Failed to fetch tweets for ${username}`,
        status: error instanceof APIError ? error.status : undefined,
      });
    }
  }

  // Test API connectivity - using confirmed working endpoint
  async testConnection(): Promise<boolean> {
    try {
      // Always use backend API for client-side or when no direct API key
      if (this.isClientSide || !this.apiKey) {
        const response = await fetch('/api/twitter/test', {
          method: 'GET',
        });
        return response.ok;
      }
      
      // Server-side with direct API access
      await this.makeRequest<any>('/user/details', { username: 'twitter' });
      return true;
    } catch (error) {
      SecureLogger.error('API connection test failed:', error);
      return false;
    }
  }

  // Get available endpoints - Updated based on analysis
  async getAvailableEndpoints(): Promise<string[]> {
    return [
      '/user/details',   // ✅ CONFIRMED WORKING
      '/user/tweets',    // ✅ CONFIRMED WORKING
      '/search/tweets',  // 🔍 TO BE TESTED
      '/user/following', // 🔍 TO BE TESTED
      '/user/followers', // 🔍 TO BE TESTED
      '/tweet/details',  // 🔍 TO BE TESTED
      '/user/media',     // 🔍 TO BE TESTED
      '/user/likes',     // 🔍 TO BE TESTED
      '/trends',         // 🔍 TO BE TESTED
      '/hashtag/tweets', // 🔍 TO BE TESTED
    ];
  }

  // NEW: Search tweets (TO BE TESTED)
  async searchTweets(query: string, count: number = 20): Promise<Tweet[]> {
    try {
      const sanitizedQuery = InputValidator.sanitizeInput(query);
      if (!sanitizedQuery) {
        throw new APIError({
          message: 'Invalid search query',
          status: 400,
        });
      }

      const { count: safeCount } = InputValidator.validatePaginationParams(count);
      const response = await this.makeRequest<any>(`/search/tweets`, {
        query: sanitizedQuery,
        count: safeCount.toString(),
      });
      
      return this.parseTweetsData(response);
    } catch (error) {
      throw new APIError({
        message: `Failed to search tweets for query: ${query}`,
        status: error instanceof APIError ? error.status : undefined,
      });
    }
  }

  // NEW: Get user followers (TO BE TESTED)
  async getUserFollowers(username: string, count: number = 20): Promise<TwitterUser[]> {
    try {
      if (!InputValidator.validateTwitterUsername(username)) {
        throw new APIError({
          message: 'Invalid Twitter username format',
          status: 400,
        });
      }

      const { count: safeCount } = InputValidator.validatePaginationParams(count);
      const cleanUsername = username.replace('@', '');
      const response = await this.makeRequest<any>(`/user/followers`, {
        username: cleanUsername,
        count: safeCount.toString(),
      });
      
      // Parse followers data - implementation depends on actual response format
      return response?.data?.map((user: any) => this.parseUserData(user)) || [];
    } catch (error) {
      throw new APIError({
        message: `Failed to fetch followers for ${username}`,
        status: error instanceof APIError ? error.status : undefined,
      });
    }
  }

  // NEW: Get user following (TO BE TESTED)
  async getUserFollowing(username: string, count: number = 20): Promise<TwitterUser[]> {
    try {
      if (!InputValidator.validateTwitterUsername(username)) {
        throw new APIError({
          message: 'Invalid Twitter username format',
          status: 400,
        });
      }

      const { count: safeCount } = InputValidator.validatePaginationParams(count);
      const cleanUsername = username.replace('@', '');
      const response = await this.makeRequest<any>(`/user/following`, {
        username: cleanUsername,
        count: safeCount.toString(),
      });
      
      // Parse following data - implementation depends on actual response format
      return response?.data?.map((user: any) => this.parseUserData(user)) || [];
    } catch (error) {
      throw new APIError({
        message: `Failed to fetch following for ${username}`,
        status: error instanceof APIError ? error.status : undefined,
      });
    }
  }

  private parseUserData(response: any): TwitterUser {
    try {
      SecureLogger.log('Parsing user data from response');

      // Multiple possible structures - let's check all of them
      let userData = null;
      let legacy = null;

      // Try different response structures
      if (response?.data?.user?.result) {
        userData = response.data.user.result;
        legacy = userData.legacy || {};
      } else if (response?.data?.user) {
        userData = response.data.user;
        legacy = userData.legacy || userData;
      } else if (response?.data) {
        userData = response.data;
        legacy = userData.legacy || userData;
      } else if (response?.user) {
        userData = response.user;
        legacy = userData.legacy || userData;
      } else {
        userData = response;
        legacy = userData.legacy || userData;
      }

      SecureLogger.log('Parsed data structures', {
        hasUserData: !!userData,
        hasLegacy: !!legacy,
        userDataKeys: userData ? Object.keys(userData) : 'null',
        legacyKeys: legacy ? Object.keys(legacy) : 'null',
        sampleData: legacy ? {
          name: legacy.name,
          screen_name: legacy.screen_name,
          followers_count: legacy.followers_count
        } : 'no legacy data'
      });

      // Enhanced parsing with more fallbacks
      const parsedUser: TwitterUser = {
        id: userData?.rest_id || userData?.id_str || userData?.id || legacy?.id_str || legacy?.id || '',
        name: legacy?.name || userData?.name || legacy?.full_name || userData?.display_name || 'Unknown User',
        username: legacy?.screen_name || userData?.screen_name || userData?.username || '',
        description: legacy?.description || userData?.description || userData?.bio || '',
        profile_image_url: legacy?.profile_image_url_https || legacy?.profile_image_url || userData?.profile_image_url || userData?.avatar || undefined,
        profile_banner_url: legacy?.profile_banner_url || userData?.profile_banner_url || userData?.banner || undefined,
        protected: legacy?.protected || userData?.protected || false,
        verified: legacy?.verified || userData?.is_blue_verified || userData?.verified || userData?.is_verified || false,
        public_metrics: {
          followers_count: legacy?.followers_count || userData?.followers_count || userData?.followers || 0,
          following_count: legacy?.friends_count || userData?.friends_count || userData?.following_count || userData?.following || 0,
          tweet_count: legacy?.statuses_count || userData?.statuses_count || userData?.tweet_count || userData?.tweets || 0,
          listed_count: legacy?.listed_count || userData?.listed_count || 0,
          like_count: legacy?.favourites_count || userData?.favourites_count || userData?.like_count || userData?.likes || 0,
        },
        created_at: legacy?.created_at || userData?.created_at || '',
        location: legacy?.location || userData?.location || '',
        url: legacy?.url || userData?.url || '',
        pinned_tweet_id: legacy?.pinned_tweet_ids_str?.[0] || userData?.pinned_tweet_id || '',
      };

      SecureLogger.success('Successfully parsed user', {
        name: parsedUser.name,
        username: parsedUser.username,
        followers: parsedUser.public_metrics?.followers_count || 0,
        verified: parsedUser.verified,
        hasProfileImage: !!parsedUser.profile_image_url
      });

      return parsedUser;

    } catch (error) {
      SecureErrorHandler.logError('Error parsing user data', error);
      
      // Return a minimal user object to prevent crashes
      return {
        id: '',
        name: 'Error Loading User',
        username: '',
        description: '',
        profile_image_url: undefined,
        profile_banner_url: undefined,
        protected: false,
        verified: false,
        public_metrics: {
          followers_count: 0,
          following_count: 0,
          tweet_count: 0,
          listed_count: 0,
          like_count: 0,
        },
        created_at: '',
        location: '',
        url: '',
        pinned_tweet_id: '',
      };
    }
  }

  private parseTweetsData(response: any): Tweet[] {
    try {
      SecureLogger.log('Parsing tweets from response...');
      
      // Multiple possible structures for tweets
      let tweetsArray = [];
      
      if (response?.data?.user?.result?.timeline?.timeline) {
        const timeline = response.data.user.result.timeline.timeline;
        
        if (timeline.instructions) {
          const entriesInstruction = timeline.instructions.find(
            (inst: any) => inst.type === 'TimelineAddEntries'
          );

          if (entriesInstruction?.entries) {
            tweetsArray = entriesInstruction.entries.filter((entry: any) => 
              entry.content?.entryType === 'TimelineTimelineItem' &&
              entry.content?.itemContent?.tweet_results?.result
            ).map((entry: any) => entry.content.itemContent.tweet_results.result);
          }
        }
      } else if (response?.data?.tweets) {
        tweetsArray = response.data.tweets;
      } else if (response?.tweets) {
        tweetsArray = response.tweets;
      } else if (Array.isArray(response?.data)) {
        tweetsArray = response.data;
      }

      SecureLogger.log(`Found ${tweetsArray.length} tweets to parse`);

      return tweetsArray.map((tweet: any, index: number) => {
        const legacy = tweet.legacy || tweet;
        
        const parsedTweet = {
          id: tweet.rest_id || tweet.id_str || tweet.id || `temp_${index}`,
          text: legacy.full_text || legacy.text || '',
          created_at: legacy.created_at || tweet.created_at || '',
          author_id: legacy.user_id_str || tweet.user_id || tweet.author_id || '',
          public_metrics: {
            retweet_count: legacy.retweet_count || tweet.retweet_count || 0,
            like_count: legacy.favorite_count || tweet.favorite_count || tweet.like_count || 0,
            reply_count: legacy.reply_count || tweet.reply_count || 0,
            quote_count: legacy.quote_count || tweet.quote_count || 0,
            bookmark_count: legacy.bookmark_count || tweet.bookmark_count || 0,
            impression_count: 0,
          },
          entities: legacy.entities || tweet.entities || {},
          context_annotations: [],
          referenced_tweets: legacy.retweeted_status_result ? [{
            type: 'retweeted' as const,
            id: legacy.retweeted_status_result.rest_id || ''
          }] : [],
          lang: legacy.lang || tweet.lang || '',
          source: tweet.source || '',
          possibly_sensitive: legacy.possibly_sensitive || tweet.possibly_sensitive || false,
        };

        SecureLogger.log(`Parsed tweet ${index + 1}`, {
          id: parsedTweet.id,
          textLength: parsedTweet.text.length,
          likes: parsedTweet.public_metrics.like_count
        });

        return parsedTweet;
      });
    } catch (error) {
      SecureErrorHandler.logError('Error parsing tweets data', error);
      return [];
    }
  }

  // NEW: Extract next cursor from response
  private extractNextCursor(response: any): string | null {
    try {
      const timeline = response?.data?.user?.result?.timeline?.timeline;
      
      if (!timeline || !timeline.instructions) {
        return null;
      }

      const entriesInstruction = timeline.instructions.find(
        (inst: any) => inst.type === 'TimelineAddEntries'
      );

      if (!entriesInstruction || !entriesInstruction.entries) {
        return null;
      }

      // Find bottom cursor for pagination
      const bottomCursor = entriesInstruction.entries.find((entry: any) => 
        entry.content?.entryType === 'TimelineTimelineCursor' &&
        entry.content?.cursorType === 'Bottom'
      );

      return bottomCursor?.content?.value || null;
    } catch (error) {
      SecureErrorHandler.logError('Error extracting cursor', error);
      return null;
    }
  }
}

// Create singleton instance
export const twitterAPI = TwitterAPIService.getInstance();

// Export class for testing
export { TwitterAPIService };