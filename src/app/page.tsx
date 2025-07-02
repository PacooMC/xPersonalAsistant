'use client';

import React, { useState, useEffect } from 'react';
import { Tweet, TwitterUser } from '@/types/twitter';
import { StyleAnalysis } from '@/types/gemini';
import { twitterAPI } from '@/services/twitterAPI';
import { geminiAPI } from '@/services/geminiAPI';
import { TweetCard } from '@/components/TweetCard';
import { GlassCard } from '@/components/ui/GlassCard';
import { StyleAnalysisComponent } from '@/components/StyleAnalysis';
import { GeminiChat } from '@/components/GeminiChat';
import { Settings } from '@/components/Settings';
import { SecureLogger } from '@/utils/security';

interface AppConfig {
  twitterUsername: string;
  hasTwitterApiKey?: boolean;
  hasGeminiApiKey?: boolean;
  configSource?: string;
  // Client-side storage for actual keys (only for local config)
  twitterApiKey?: string;
  geminiApiKey?: string;
}

interface SettingsConfig {
  twitterUsername: string;
  twitterApiKey: string;
  geminiApiKey: string;
}

// Helper functions to convert between config formats
const appConfigToSettings = (appConfig: AppConfig): SettingsConfig => ({
  twitterUsername: appConfig.twitterUsername,
  twitterApiKey: appConfig.twitterApiKey || '',
  geminiApiKey: appConfig.geminiApiKey || ''
});

const settingsToAppConfig = (settingsConfig: SettingsConfig): AppConfig => ({
  twitterUsername: settingsConfig.twitterUsername,
  twitterApiKey: settingsConfig.twitterApiKey,
  geminiApiKey: settingsConfig.geminiApiKey,
  hasTwitterApiKey: !!settingsConfig.twitterApiKey,
  hasGeminiApiKey: !!settingsConfig.geminiApiKey,
  configSource: 'localStorage'
});

export default function HomePage() {
  // Configuration
  const [config, setConfig] = useState<AppConfig>({
    twitterUsername: process.env.NEXT_PUBLIC_DEFAULT_USERNAME || '',
    hasTwitterApiKey: false,
    hasGeminiApiKey: false,
    configSource: 'default'
  });
  const [showSettings, setShowSettings] = useState(false);

  // API Status
  const [apiStatus, setApiStatus] = useState<'loading' | 'connected' | 'error'>('loading');
  const [geminiConnected, setGeminiConnected] = useState<boolean>(false);

  // User Profile
  const [user, setUser] = useState<TwitterUser | null>(null);
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pagination
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  // Gemini state
  const [styleAnalysis, setStyleAnalysis] = useState<StyleAnalysis | null>(null);
  const [analyzingStyle, setAnalyzingStyle] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);

  // UI State
  const [activeTab, setActiveTab] = useState<'profile' | 'community' | 'opportunities' | 'style-memory'>('profile');
  const [tweetsCompact, setTweetsCompact] = useState<boolean>(true);

  // Style Memory
  const [savedStyleAnalysis, setSavedStyleAnalysis] = useState<StyleAnalysis | null>(null);
  const [exampleTweets, setExampleTweets] = useState<Tweet[]>([]);

  useEffect(() => {
    loadConfig();
  }, []);

  useEffect(() => {
    if (config.hasTwitterApiKey || config.hasGeminiApiKey) {
      // Update API services with new config (only for localStorage config)
      if (config.configSource === 'localStorage') {
        updateAPIConfig();
      }
      checkAPIStatus();
      checkGeminiStatus();
      
      // Reload data if username changed
      if (config.twitterUsername) {
        loadUserProfile();
      }
    }
  }, [config]);

  const loadConfig = async () => {
    try {
      // Load from localStorage since /api/config has been removed for security
      const savedConfig = localStorage.getItem('app-config');
      if (savedConfig) {
        const parsed = JSON.parse(savedConfig);
        SecureLogger.success('Config loaded from localStorage successfully');
        
        // For localStorage config, we need the actual keys for client-side services
        setConfig(prev => ({ 
          ...prev, 
          ...parsed,
          hasTwitterApiKey: !!parsed.twitterApiKey,
          hasGeminiApiKey: !!parsed.geminiApiKey,
          configSource: 'localStorage'
        }));
      }
      
      loadSavedStyleMemory();
    } catch (error) {
      SecureLogger.error('Error loading config:', error);
      loadSavedStyleMemory();
    }
  };

  const saveConfig = async (settingsConfig: SettingsConfig) => {
    try {
      // Convert settings format to app config format
      const newConfig = settingsToAppConfig(settingsConfig);
      
      // Save to localStorage (API route removed for security)
      localStorage.setItem('app-config', JSON.stringify(settingsConfig));
      setConfig(newConfig);
      
      SecureLogger.success('Config saved successfully');
    } catch (error) {
      SecureLogger.error('Error saving config:', error);
    }
  };

  const updateAPIConfig = () => {
    // Only update API services for localStorage config that has actual keys
    if (config.configSource === 'localStorage') {
      // Update Twitter API service
      if (config.twitterApiKey) {
        twitterAPI.updateConfig({
          apiKey: config.twitterApiKey
        });
      }
      
      // Update Gemini API service  
      if (config.geminiApiKey) {
        geminiAPI.updateConfig({
          apiKey: config.geminiApiKey
        });
      }
    }
    // For env config, API services will use environment variables directly
  };

  const loadSavedStyleMemory = () => {
    try {
      const saved = localStorage.getItem('style-analysis');
      const savedTweets = localStorage.getItem('example-tweets');
      if (saved) {
        setSavedStyleAnalysis(JSON.parse(saved));
      }
      if (savedTweets) {
        setExampleTweets(JSON.parse(savedTweets));
      }
    } catch (error) {
      SecureLogger.error('Error loading saved style memory:', error);
    }
  };

  const saveStyleMemory = (analysis: StyleAnalysis, tweets: Tweet[]) => {
    try {
      localStorage.setItem('style-analysis', JSON.stringify(analysis));
      localStorage.setItem('example-tweets', JSON.stringify(tweets.slice(0, 5))); // Save top 5 tweets as examples
      setSavedStyleAnalysis(analysis);
      setExampleTweets(tweets.slice(0, 5));
    } catch (error) {
      SecureLogger.error('Error saving style memory:', error);
    }
  };

  const checkAPIStatus = async () => {
    try {
      const isConnected = await twitterAPI.testConnection();
      setApiStatus(isConnected ? 'connected' : 'error');
    } catch (error) {
      setApiStatus('error');
    }
  };

  const checkGeminiStatus = async () => {
    try {
      const isConnected = await geminiAPI.testConnection();
      setGeminiConnected(isConnected);
    } catch (error) {
      SecureLogger.error('Gemini connection failed:', error);
      setGeminiConnected(false);
    }
  };

  const loadUserProfile = async () => {
    if (!config.twitterUsername) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const tweetData = await twitterAPI.getUserTweetsWithCursor(config.twitterUsername, 20);
      
      if (tweetData.user) {
        setUser(tweetData.user);
      }
      
      setTweets(tweetData.tweets);
      setNextCursor(tweetData.nextCursor);
      setHasMore(tweetData.hasMore);
      
      SecureLogger.success(`Loaded ${tweetData.tweets.length} tweets for @${config.twitterUsername}`);
      
    } catch (error) {
      SecureLogger.error('Error loading user profile:', error);
      setError(error instanceof Error ? error.message : 'Error loading profile');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMoreTweets = async () => {
    if (!nextCursor || loadingMore || !config.twitterUsername) return;
    
    setLoadingMore(true);
    setError(null);
    
    try {
      const tweetData = await twitterAPI.getUserTweetsWithCursor(config.twitterUsername, 20, nextCursor);
      
      setTweets(prevTweets => [...prevTweets, ...tweetData.tweets]);
      setNextCursor(tweetData.nextCursor);
      setHasMore(tweetData.hasMore);
      
      SecureLogger.success(`Loaded ${tweetData.tweets.length} more tweets. Total: ${tweets.length + tweetData.tweets.length}`);
      
    } catch (error) {
      SecureLogger.error('Error loading more tweets:', error);
      setError(error instanceof Error ? error.message : 'Error loading more tweets');
    } finally {
      setLoadingMore(false);
    }
  };

  const handleAnalyzeStyle = async () => {
    if (!user || tweets.length === 0) return;
    
    setAnalyzingStyle(true);
    try {
      const analysis = await geminiAPI.analyzeWritingStyle(tweets, user);
      setStyleAnalysis(analysis);
      saveStyleMemory(analysis, tweets);
    } catch (error) {
      SecureLogger.error('Error analyzing style:', error);
    } finally {
      setAnalyzingStyle(false);
    }
  };

  const handleSendMessage = async (message: string): Promise<string> => {
    setChatLoading(true);
    try {
      const context = user ? `Usuario: @${user.username}, Bio: ${user.description}` : '';
      const response = await geminiAPI.chat(message, context);
      return response.content;
    } catch (error) {
      SecureLogger.error('Error sending message:', error);
      return 'Sorry, there was an error processing your message.';
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="app-layout">
      {/* Header */}
      <div className="app-header">
        <div className="header-content">
          <div className="app-title">
            <h1>X Personal Assistant</h1>
            <p>Analyze and improve your Twitter presence with AI</p>
          </div>
          
          {/* API Status and Settings */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div className="api-status">
              <div className="status-item">
                <span>Twitter</span>
                <div className={`status-indicator ${apiStatus}`}>
                  <div className="status-dot"></div>
                  <span>{apiStatus === 'connected' ? 'Connected' : apiStatus === 'error' ? 'Error' : 'Checking...'}</span>
                </div>
              </div>
              <div className="status-item">
                <span>Gemini</span>
                <div className={`status-indicator ${geminiConnected ? 'connected' : 'error'}`}>
                  <div className="status-dot"></div>
                  <span>{geminiConnected ? 'Connected' : 'Error'}</span>
                </div>
              </div>
            </div>
            
            {/* Settings Button */}
            <button
              onClick={() => setShowSettings(true)}
              className="btn-compact"
              style={{
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(139, 92, 246, 0.15) 100%)',
                borderColor: 'rgba(139, 92, 246, 0.4)',
                color: '#a855f7',
                fontSize: '20px',
                padding: '10px',
                minWidth: '44px',
                height: '44px'
              }}
              title="Settings"
            >
              ⚙️
            </button>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      <Settings
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        onSave={saveConfig}
        currentConfig={appConfigToSettings(config)}
      />

      {/* Main Layout */}
      <div className="app-main">
        {/* Left Content */}
        <div className="content-area">
          {/* Configuration Warning */}
          {(!config.hasTwitterApiKey || !config.hasGeminiApiKey) && (
            <div style={{
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(245, 158, 11, 0.1) 100%)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              borderRadius: '16px',
              padding: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              marginBottom: '24px'
            }}>
              <span style={{ fontSize: '32px', flexShrink: 0 }}>⚠️</span>
              <div style={{ flex: 1 }}>
                <h3 style={{
                  fontSize: '16px',
                  fontWeight: '700',
                  color: '#fbbf24',
                  margin: '0 0 8px 0'
                }}>
                  Configuration Required
                </h3>
                <p style={{
                  fontSize: '14px',
                  color: '#f59e0b',
                  margin: '0 0 12px 0',
                  lineHeight: '1.5'
                }}>
                  To use all features, you need to configure your API keys.
                </p>
                <button
                  onClick={() => setShowSettings(true)}
                  className="btn-compact"
                  style={{
                    background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.3) 0%, rgba(245, 158, 11, 0.2) 100%)',
                    borderColor: 'rgba(245, 158, 11, 0.5)',
                    color: '#fbbf24'
                  }}
                >
                  ⚙️ Open Settings
                </button>
              </div>
            </div>
          )}

          {/* User Profile Compact */}
          {user && (
            <div className="profile-compact">
              <img src={user.profile_image_url} alt={user.name} className="profile-avatar" />
              <div className="profile-info">
                <div className="profile-name">
                  <h3>{user.name}</h3>
                  {user.verified && <span className="verified-badge">✓</span>}
                </div>
                <p className="profile-username">@{user.username}</p>
                <div className="profile-stats">
                  <span><strong>{user.public_metrics?.following_count || 0}</strong> Following</span>
                  <span><strong>{user.public_metrics?.followers_count || 0}</strong> Followers</span>
                  <span><strong>{user.public_metrics?.tweet_count || 0}</strong> Tweets</span>
                </div>
              </div>
            </div>
          )}

          {/* Style Analysis */}
          {geminiConnected && (
            <div className="analysis-section">
              <StyleAnalysisComponent 
                analysis={styleAnalysis}
                isLoading={analyzingStyle}
                onAnalyze={handleAnalyzeStyle}
              />
            </div>
          )}

          {/* Tabs Navigation */}
          <div className="tabs-container">
            <div className="tabs-nav">
              <button 
                className={`tab-button ${activeTab === 'profile' ? 'active' : ''}`}
                onClick={() => setActiveTab('profile')}
              >
                📱 My Tweets
              </button>
              <button 
                className={`tab-button ${activeTab === 'style-memory' ? 'active' : ''}`}
                onClick={() => setActiveTab('style-memory')}
              >
                🧠 Style Memory
              </button>
              <button 
                className={`tab-button ${activeTab === 'community' ? 'active' : ''}`}
                onClick={() => setActiveTab('community')}
              >
                🌍 Community
              </button>
              <button 
                className={`tab-button ${activeTab === 'opportunities' ? 'active' : ''}`}
                onClick={() => setActiveTab('opportunities')}
              >
                🎯 Opportunities
              </button>
            </div>

            {/* Tab Content */}
            <div className="tab-content">
              {activeTab === 'profile' && (
                <div className="tweets-section">
                  <div className="section-header">
                    <h3>📱 Tweets from @{config.twitterUsername} ({tweets.length})</h3>
                    <div className="section-actions">
                      <button 
                        onClick={loadUserProfile} 
                        disabled={loading}
                        className="btn-compact"
                      >
                        {loading ? '⏳' : '🔄'} Refresh
                      </button>
                      <button 
                        onClick={() => setTweetsCompact(!tweetsCompact)}
                        className={`btn-compact ${tweetsCompact ? '' : 'view-toggle'}`}
                      >
                        {tweetsCompact ? '📋 Expand' : '🗂️ Compact'}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <div className="error-message">
                      ❌ {error}
                    </div>
                  )}

                  {tweets.length > 0 && (
                    <div className={`tweets-grid ${tweetsCompact ? 'compact' : 'expanded'}`}>
                      {tweets.map((tweet) => (
                        <div key={tweet.id} className="tweet-wrapper">
                          <TweetCard tweet={tweet} compact={tweetsCompact} />
                        </div>
                      ))}
                    </div>
                  )}

                  {hasMore && (
                    <div className="load-more">
                      <button 
                        onClick={handleLoadMoreTweets} 
                        disabled={loadingMore}
                        className="btn-secondary"
                      >
                        {loadingMore ? '⏳ Loading...' : '⬇️ Load More Tweets'}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'style-memory' && (
                <div className="style-memory-section">
                  {savedStyleAnalysis ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                      <div className="section-header">
                        <h3>🧠 Your Saved Writing Style</h3>
                        <button 
                          onClick={() => {
                            setSavedStyleAnalysis(null);
                            setExampleTweets([]);
                            localStorage.removeItem('style-analysis');
                            localStorage.removeItem('example-tweets');
                          }}
                          className="btn-compact"
                          style={{
                            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(220, 38, 38, 0.15) 100%)',
                            borderColor: 'rgba(239, 68, 68, 0.3)',
                            color: '#fca5a5'
                          }}
                        >
                          🗑️ Clear Memory
                        </button>
                      </div>

                      {/* Style Analysis Summary */}
                      <div style={{
                        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
                        backdropFilter: 'blur(20px) saturate(180%)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        borderRadius: '20px',
                        padding: '32px',
                        position: 'relative',
                        overflow: 'hidden',
                        boxShadow: '0 12px 40px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.15)'
                      }}>
                        <div style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          height: '1px',
                          background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent)'
                        }}/>

                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginBottom: '24px'
                        }}>
                          <div style={{
                            background: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)',
                            padding: '20px 28px',
                            borderRadius: '50%',
                            boxShadow: '0 12px 32px rgba(16, 185, 129, 0.3)',
                            position: 'relative',
                            border: '3px solid rgba(255, 255, 255, 0.2)'
                          }}>
                            <span style={{
                              fontSize: '32px',
                              fontWeight: '800',
                              color: '#ffffff',
                              letterSpacing: '-0.02em'
                            }}>
                              {savedStyleAnalysis.score}/100
                            </span>
                          </div>
                        </div>

                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                          gap: '20px',
                          marginBottom: '24px'
                        }}>
                          <div style={{
                            background: 'rgba(59, 130, 246, 0.1)',
                            padding: '16px',
                            borderRadius: '12px',
                            border: '1px solid rgba(59, 130, 246, 0.2)'
                          }}>
                            <h4 style={{ color: '#60a5fa', margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600' }}>
                              🎭 OVERALL TONE
                            </h4>
                            <p style={{ color: '#f8fafc', margin: 0, fontSize: '14px' }}>
                              {savedStyleAnalysis.overall_tone}
                            </p>
                          </div>
                          <div style={{
                            background: 'rgba(34, 197, 94, 0.1)',
                            padding: '16px',
                            borderRadius: '12px',
                            border: '1px solid rgba(34, 197, 94, 0.2)'
                          }}>
                            <h4 style={{ color: '#22c55e', margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600' }}>
                              💭 SENTIMENT
                            </h4>
                            <p style={{ color: '#f8fafc', margin: 0, fontSize: '14px' }}>
                              {savedStyleAnalysis.emotional_sentiment}
                            </p>
                          </div>
                          <div style={{
                            background: 'rgba(245, 158, 11, 0.1)',
                            padding: '16px',
                            borderRadius: '12px',
                            border: '1px solid rgba(245, 158, 11, 0.2)'
                          }}>
                            <h4 style={{ color: '#f59e0b', margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600' }}>
                              🔥 ENGAGEMENT
                            </h4>
                            <p style={{ color: '#f8fafc', margin: 0, fontSize: '14px', textTransform: 'capitalize' }}>
                              {savedStyleAnalysis.engagement_level}
                            </p>
                          </div>
                        </div>

                        <div style={{
                          background: 'rgba(139, 92, 246, 0.1)',
                          padding: '20px',
                          borderRadius: '16px',
                          border: '1px solid rgba(139, 92, 246, 0.2)'
                        }}>
                          <h4 style={{ 
                            color: '#a855f7', 
                            margin: '0 0 12px 0', 
                            fontSize: '16px', 
                            fontWeight: '600',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}>
                            ✍️ Your Writing Style
                          </h4>
                          <p style={{ color: '#f8fafc', margin: 0, fontSize: '15px', lineHeight: '1.6' }}>
                            {savedStyleAnalysis.writing_style}
                          </p>
                        </div>
                      </div>

                      {/* Common Topics */}
                      <div style={{
                        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.04) 100%)',
                        backdropFilter: 'blur(16px) saturate(150%)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        borderRadius: '16px',
                        padding: '24px',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)'
                      }}>
                        <h3 style={{
                          fontSize: '16px',
                          fontWeight: '700',
                          color: '#60a5fa',
                          marginBottom: '16px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}>
                          🏷️ Your Main Topics
                        </h3>
                        <div style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: '12px'
                        }}>
                          {savedStyleAnalysis.common_topics.map((topic, index) => (
                            <span
                              key={index}
                              style={{
                                padding: '8px 16px',
                                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(59, 130, 246, 0.15) 100%)',
                                color: '#93c5fd',
                                borderRadius: '16px',
                                fontSize: '14px',
                                border: '1px solid rgba(59, 130, 246, 0.3)',
                                fontWeight: '600',
                                backdropFilter: 'blur(10px)'
                              }}
                            >
                              {topic}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Example Tweets */}
                      {exampleTweets.length > 0 && (
                        <div>
                          <h3 style={{
                            fontSize: '20px',
                            fontWeight: '700',
                            color: '#f8fafc',
                            marginBottom: '20px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px'
                          }}>
                            📝 Examples of Your Style
                          </h3>
                          <div className="tweets-grid expanded">
                            {exampleTweets.map((tweet) => (
                              <div key={tweet.id} className="tweet-wrapper">
                                <TweetCard tweet={tweet} compact={false} />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="coming-soon">
                      <h3>🧠 Style Memory</h3>
                      <p>🚧 You haven't saved any style analysis yet</p>
                      <div style={{
                        padding: '24px',
                        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%)',
                        border: '1px solid rgba(59, 130, 246, 0.2)',
                        borderRadius: '16px',
                        marginTop: '24px'
                      }}>
                        <p style={{
                          color: '#f8fafc',
                          fontSize: '16px',
                          lineHeight: '1.6',
                          margin: 0
                        }}>
                          💡 <strong>Tip:</strong> Run the style analysis in the section above to automatically save your writing profile and view it here anytime.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'community' && (
                <div className="community-section">
                  <div className="coming-soon">
                    <h3>🌍 Community Tweets</h3>
                    <p>🚧 Coming Soon: Search tweets by hashtags and communities</p>
                    <div className="feature-preview">
                      <input 
                        type="text" 
                        placeholder="Example: #AI #coding #javascript"
                        className="search-input"
                        disabled
                      />
                      <button disabled className="search-btn">🔍 Search</button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'opportunities' && (
                <div className="opportunities-section">
                  <div className="coming-soon">
                    <h3>🎯 Engagement Opportunities</h3>
                    <p>🚧 Coming Soon: AI will analyze which tweets you can reply to based on your style</p>
                    <div className="feature-list">
                      <div className="feature-item">✨ Intelligent content matching</div>
                      <div className="feature-item">🤖 Response suggestions</div>
                      <div className="feature-item">📊 Potential engagement analysis</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar - Fixed Chat */}
        <div className="chat-sidebar">
          <div className="chat-container">
            <GeminiChat 
              onSendMessage={handleSendMessage}
              isLoading={chatLoading}
            />
          </div>
        </div>
      </div>
    </div>
  );
}