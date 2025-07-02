export interface GeminiConfig {
  apiKey: string;
  model: string;
}

export interface StyleAnalysis {
  overall_tone: string;
  writing_style: string;
  common_topics: string[];
  language_patterns: string[];
  emotional_sentiment: string;
  engagement_level: string;
  suggestions: string[];
  score: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface ChatSession {
  id: string;
  messages: ChatMessage[];
  created_at: Date;
  title: string;
}

export interface GeminiResponse {
  content: string;
  usage?: {
    promptTokens: number;
    candidateTokens: number;
    totalTokens: number;
  };
}

export interface AnalysisRequest {
  tweets: string[];
  userProfile: {
    name: string;
    username: string;
    bio: string;
  };
  analysisType: 'style' | 'content' | 'engagement';
}

export interface GeminiError {
  message: string;
  code?: string;
  status?: number;
} 