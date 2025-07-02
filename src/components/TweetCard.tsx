import React from 'react';
import { Tweet } from '@/types/twitter';
import { formatDistanceToNow } from 'date-fns';

interface TweetCardProps {
  tweet: Tweet;
  showMetrics?: boolean;
  compact?: boolean;
}

export const TweetCard: React.FC<TweetCardProps> = ({ 
  tweet, 
  showMetrics = true,
  compact = false 
}) => {
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch {
      return 'Unknown date';
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  return (
    <div className={`tweet-card ${compact ? 'compact' : 'expanded'} fade-in`}>
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: compact ? '12px' : '20px' 
      }}>
        {/* Tweet Content */}
        <div style={{ 
          color: '#f8fafc', 
          lineHeight: compact ? '1.5' : '1.7', 
          fontSize: compact ? '14px' : '16px',
          fontWeight: '400',
          display: '-webkit-box',
          WebkitLineClamp: compact ? 4 : 'unset',
          WebkitBoxOrient: 'vertical',
          overflow: compact ? 'hidden' : 'visible',
          letterSpacing: '0.01em'
        }}>
          {tweet.text}
        </div>

        {/* Tweet Metadata */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          fontSize: compact ? '12px' : '14px',
          color: '#94a3b8',
          fontWeight: '500'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: compact ? '10px' : '16px' 
          }}>
            <span style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px',
              padding: '4px 8px',
              background: 'rgba(255, 255, 255, 0.08)',
              borderRadius: '8px',
              backdropFilter: 'blur(10px)'
            }}>
              <svg 
                style={{ 
                  width: compact ? '12px' : '14px', 
                  height: compact ? '12px' : '14px', 
                  flexShrink: 0,
                  opacity: 0.8
                }}
                fill="currentColor" 
                viewBox="0 0 20 20"
              >
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              <span style={{ fontSize: compact ? '11px' : '12px' }}>
                {formatDate(tweet.created_at)}
              </span>
            </span>
            
            {!compact && tweet.lang && (
              <span style={{
                fontSize: '11px',
                backgroundColor: 'rgba(59, 130, 246, 0.15)',
                color: '#60a5fa',
                padding: '4px 10px',
                borderRadius: '12px',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                fontWeight: '600',
                letterSpacing: '0.05em'
              }}>
                {tweet.lang.toUpperCase()}
              </span>
            )}
          </div>

          {!compact && (
            <div style={{ 
              fontSize: '11px', 
              color: '#64748b',
              fontFamily: 'monospace',
              opacity: 0.7
            }}>
              #{tweet.id.slice(-6)}
            </div>
          )}
        </div>

        {/* Tweet Metrics */}
        {showMetrics && !compact && tweet.public_metrics && (
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: '16px',
            borderTop: '1px solid rgba(255, 255, 255, 0.12)'
          }}>
            <div style={{ 
              display: 'flex', 
              gap: '28px', 
              fontSize: '14px', 
              color: '#94a3b8',
              fontWeight: '500'
            }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '6px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                padding: '6px 10px',
                borderRadius: '10px',
                background: 'rgba(34, 197, 94, 0.08)',
                border: '1px solid rgba(34, 197, 94, 0.2)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(34, 197, 94, 0.15)';
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.color = '#22c55e';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(34, 197, 94, 0.08)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.color = '#94a3b8';
              }}
              >
                <svg 
                  style={{ width: '16px', height: '16px', flexShrink: 0 }}
                  fill="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/>
                </svg>
                <span style={{ fontSize: '13px', fontWeight: '600' }}>
                  {formatNumber(tweet.public_metrics.reply_count)}
                </span>
              </div>

              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '6px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                padding: '6px 10px',
                borderRadius: '10px',
                background: 'rgba(59, 130, 246, 0.08)',
                border: '1px solid rgba(59, 130, 246, 0.2)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(59, 130, 246, 0.15)';
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.color = '#3b82f6';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(59, 130, 246, 0.08)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.color = '#94a3b8';
              }}
              >
                <svg 
                  style={{ width: '16px', height: '16px', flexShrink: 0 }}
                  fill="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path d="M23.77 15.67c-.292-.293-.767-.293-1.06 0l-2.22 2.22V7.65c0-2.068-1.683-3.75-3.75-3.75h-5.85c-.414 0-.75.336-.75.75s.336.75.75.75h5.85c1.24 0 2.25 1.01 2.25 2.25v10.24l-2.22-2.22c-.293-.293-.768-.293-1.061 0s-.293.768 0 1.061l3.5 3.5c.145.147.337.22.53.22s.385-.073.53-.22l3.5-3.5c.294-.293.294-.768.001-1.061z"/>
                </svg>
                <span style={{ fontSize: '13px', fontWeight: '600' }}>
                  {formatNumber(tweet.public_metrics.retweet_count)}
                </span>
              </div>

              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '6px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                padding: '6px 10px',
                borderRadius: '10px',
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.2)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)';
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.color = '#ef4444';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.color = '#94a3b8';
              }}
              >
                <svg 
                  style={{ width: '16px', height: '16px', flexShrink: 0 }}
                  fill="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
                <span style={{ fontSize: '13px', fontWeight: '600' }}>
                  {formatNumber(tweet.public_metrics.like_count)}
                </span>
              </div>

              {tweet.public_metrics.quote_count !== undefined && (
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  padding: '6px 10px',
                  borderRadius: '10px',
                  background: 'rgba(245, 158, 11, 0.08)',
                  border: '1px solid rgba(245, 158, 11, 0.2)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(245, 158, 11, 0.15)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.color = '#f59e0b';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(245, 158, 11, 0.08)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.color = '#94a3b8';
                }}
                >
                  <svg 
                    style={{ width: '16px', height: '16px', flexShrink: 0 }}
                    fill="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path d="M14.17 11L16.1 13.5L14.17 16H20V11H14.17ZM4 16H9.83L7.9 13.5L9.83 11H4V16Z"/>
                  </svg>
                  <span style={{ fontSize: '13px', fontWeight: '600' }}>
                    {formatNumber(tweet.public_metrics.quote_count)}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Compact Metrics */}
        {showMetrics && compact && tweet.public_metrics && (
          <div style={{
            display: 'flex',
            gap: '16px',
            fontSize: '12px',
            color: '#64748b',
            justifyContent: 'center',
            paddingTop: '8px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)'
          }}>
            <span style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '2px 6px',
              background: 'rgba(34, 197, 94, 0.1)',
              borderRadius: '6px',
              fontWeight: '500'
            }}>
              💬 {formatNumber(tweet.public_metrics.reply_count)}
            </span>
            <span style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '2px 6px',
              background: 'rgba(59, 130, 246, 0.1)',
              borderRadius: '6px',
              fontWeight: '500'
            }}>
              🔄 {formatNumber(tweet.public_metrics.retweet_count)}
            </span>
            <span style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '2px 6px',
              background: 'rgba(239, 68, 68, 0.1)',
              borderRadius: '6px',
              fontWeight: '500'
            }}>
              ❤️ {formatNumber(tweet.public_metrics.like_count)}
            </span>
          </div>
        )}

        {/* Entities (hashtags, mentions, URLs) */}
        {tweet.entities && !compact && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {tweet.entities.hashtags && tweet.entities.hashtags.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {tweet.entities.hashtags.slice(0, 5).map((hashtag, index) => (
                  <span 
                    key={index}
                    style={{
                      fontSize: '12px',
                      background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(59, 130, 246, 0.15) 100%)',
                      color: '#93c5fd',
                      padding: '6px 12px',
                      borderRadius: '12px',
                      border: '1px solid rgba(59, 130, 246, 0.3)',
                      fontWeight: '600',
                      backdropFilter: 'blur(10px)',
                      transition: 'all 0.3s ease',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'linear-gradient(135deg, rgba(59, 130, 246, 0.3) 0%, rgba(59, 130, 246, 0.2) 100%)';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(59, 130, 246, 0.15) 100%)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    #{hashtag.tag}
                  </span>
                ))}
                {tweet.entities.hashtags.length > 5 && (
                  <span style={{
                    fontSize: '12px',
                    color: '#64748b',
                    padding: '6px 12px',
                    fontWeight: '500'
                  }}>
                    +{tweet.entities.hashtags.length - 5} more
                  </span>
                )}
              </div>
            )}

            {tweet.entities.mentions && tweet.entities.mentions.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {tweet.entities.mentions.slice(0, 3).map((mention, index) => (
                  <span 
                    key={index}
                    style={{
                      fontSize: '12px',
                      background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(139, 92, 246, 0.15) 100%)',
                      color: '#c4b5fd',
                      padding: '6px 12px',
                      borderRadius: '12px',
                      border: '1px solid rgba(139, 92, 246, 0.3)',
                      fontWeight: '600',
                      backdropFilter: 'blur(10px)',
                      transition: 'all 0.3s ease',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'linear-gradient(135deg, rgba(139, 92, 246, 0.3) 0%, rgba(139, 92, 246, 0.2) 100%)';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(139, 92, 246, 0.15) 100%)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    @{mention.username}
                  </span>
                ))}
                {tweet.entities.mentions.length > 3 && (
                  <span style={{
                    fontSize: '12px',
                    color: '#64748b',
                    padding: '6px 12px',
                    fontWeight: '500'
                  }}>
                    +{tweet.entities.mentions.length - 3} more
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};