import { 
  GeminiConfig, 
  StyleAnalysis, 
  ChatMessage, 
  ChatSession, 
  GeminiResponse, 
  AnalysisRequest,
  GeminiError 
} from '@/types/gemini';
import { Tweet, TwitterUser } from '@/types/twitter';

const MODEL_NAME = 'gemini-2.0-flash';

class GeminiAPIService {
  private static instance: GeminiAPIService;
  private apiKey: string = '';

  private constructor() {
    // Client-side service that uses API routes
  }

  public static getInstance(): GeminiAPIService {
    if (!GeminiAPIService.instance) {
      GeminiAPIService.instance = new GeminiAPIService();
    }
    return GeminiAPIService.instance;
  }

  // Update configuration
  public updateConfig(config: { apiKey: string }) {
    if (config.apiKey) {
      this.apiKey = config.apiKey;
    }
  }

  // Get current API key (masked for security)
  public getCurrentApiKey(): string {
    if (!this.apiKey) return '';
    return this.apiKey.substring(0, 8) + '...';
  }

  // Test connection with Gemini via API route
  async testConnection(): Promise<boolean> {
    try {
      const requestBody: any = {
        action: 'test'
      };
      
      // Only send API key if we have one set (for localStorage config)
      if (this.apiKey) {
        requestBody.apiKey = this.apiKey;
      }
      
      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      return data.success === true;
    } catch (error) {
      console.error('Gemini connection test failed:', error);
      return false;
    }
  }

  // Analyze Twitter writing style via API route
  async analyzeWritingStyle(tweets: Tweet[], user: TwitterUser): Promise<StyleAnalysis> {
    try {
      const requestBody: any = {
        action: 'analyze',
        data: { tweets, user }
      };
      
      // Only send API key if we have one set (for localStorage config)
      if (this.apiKey) {
        requestBody.apiKey = this.apiKey;
      }
      
      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze writing style');
      }

      const data = await response.json();
      return data.analysis;
    } catch (error) {
      console.error('Error analyzing writing style:', error);
      throw new Error('Failed to analyze writing style');
    }
  }

  // Chat with Gemini via API route
  async chat(message: string, context?: string): Promise<GeminiResponse> {
    try {
      const requestBody: any = {
        action: 'chat',
        data: { message, context }
      };
      
      // Only send API key if we have one set (for localStorage config)
      if (this.apiKey) {
        requestBody.apiKey = this.apiKey;
      }
      
      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error('Failed to get chat response');
      }

      const data = await response.json();
      return {
        content: data.content,
        usage: data.usage,
      };
    } catch (error) {
      console.error('Error in chat:', error);
      throw new Error('Failed to get chat response');
    }
  }

  // Generate tweet suggestions (placeholder - could be implemented if needed)
  async generateTweetSuggestions(styleAnalysis: StyleAnalysis, context: string): Promise<string[]> {
    try {
      // This would need a new API route endpoint, keeping simple for now
      return [];
    } catch (error) {
      console.error('Error generating tweet suggestions:', error);
      return [];
    }
  }

  // Analyze content opportunities (placeholder - could be implemented if needed)  
  async analyzeContentOpportunities(tweets: Tweet[], userStyle: StyleAnalysis): Promise<string[]> {
    try {
      // This would need a new API route endpoint, keeping simple for now
      return [];
    } catch (error) {
      console.error('Error analyzing content opportunities:', error);
      return [];
    }
  }

  // Get model info
  getModelInfo(): GeminiConfig {
    return {
      apiKey: this.apiKey ? '***' : '', // Hidden for security
      model: MODEL_NAME,
    };
  }
}

// Create singleton instance that doesn't fail on the client
export const geminiAPI = GeminiAPIService.getInstance();

// Export class for testing
export { GeminiAPIService };