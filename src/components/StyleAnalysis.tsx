'use client';

import { useState } from 'react';
import { StyleAnalysis } from '@/types/gemini';

interface StyleAnalysisProps {
  analysis: StyleAnalysis | null;
  isLoading: boolean;
  onAnalyze: () => void;
}

export function StyleAnalysisComponent({ 
  analysis, 
  isLoading, 
  onAnalyze 
}: StyleAnalysisProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div 
      className="style-analysis"
      style={{
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        borderRadius: '16px',
        padding: '24px',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
        marginBottom: '32px' // Separar más del resto del contenido
      }}
    >
      {/* Decorative top border */}
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
        justifyContent: 'space-between',
        marginBottom: analysis && !isLoading ? '16px' : '24px'
      }}>
        <button
          className="collapsible-header"
          onClick={() => analysis && setIsCollapsed(!isCollapsed)}
          style={{
            cursor: analysis ? 'pointer' : 'default'
          }}
        >
          <h2 style={{
            fontSize: '20px',
            fontWeight: '700',
            color: '#f8fafc',
            margin: 0,
            letterSpacing: '-0.02em',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <span style={{
              fontSize: '22px',
              filter: 'drop-shadow(0 0 6px rgba(59, 130, 246, 0.4))'
            }}>
              📊
            </span>
            Style Analysis
          </h2>
          {analysis && !isLoading && (
            <div 
              className={`collapse-icon ${isCollapsed ? 'collapsed' : ''}`}
              style={{
                fontSize: '18px',
                color: '#94a3b8',
                transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            >
              🔽
            </div>
          )}
        </button>
        <button
          onClick={onAnalyze}
          disabled={isLoading}
          className="btn-analyze"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          {isLoading ? (
            <>
              <div style={{
                width: '14px',
                height: '14px',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                borderTop: '2px solid #ffffff',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }}/>
              Analyzing...
            </>
          ) : (
            <>
              ✨ Analyze
            </>
          )}
        </button>
      </div>

      {isLoading && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '32px 24px',
          flexDirection: 'column',
          gap: '16px'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid rgba(59, 130, 246, 0.3)',
            borderTop: '3px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}/>
          <span style={{
            color: '#60a5fa',
            fontSize: '14px',
            fontWeight: '600',
            textAlign: 'center'
          }}>
            Analyzing your writing style with Gemini...
          </span>
        </div>
      )}

      <div className={`collapsible-content ${analysis && !isLoading ? (isCollapsed ? 'collapsed' : 'expanded') : ''}`}>
        {analysis && !isLoading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Score Badge - Más pequeño y minimalista */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '4px'
            }}>
              <div style={{
                background: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)',
                padding: '12px 20px',
                borderRadius: '20px',
                boxShadow: '0 8px 24px rgba(16, 185, 129, 0.25)',
                position: 'relative',
                border: '2px solid rgba(255, 255, 255, 0.15)'
              }}>
                <span style={{
                  fontSize: '24px',
                  fontWeight: '800',
                  color: '#ffffff',
                  letterSpacing: '-0.02em'
                }}>
                  {analysis.score}/100
                </span>
              </div>
            </div>

            {/* Analysis Sections - Más compactas */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '12px'
            }}>
              {/* Overall Tone */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.06) 0%, rgba(255, 255, 255, 0.03) 100%)',
                backdropFilter: 'blur(12px) saturate(150%)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                padding: '16px',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)';
                e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.3)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255, 255, 255, 0.06) 0%, rgba(255, 255, 255, 0.03) 100%)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
              >
                <h3 style={{
                  fontSize: '12px',
                  fontWeight: '700',
                  color: '#60a5fa',
                  marginBottom: '8px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  🎭 Tono General
                </h3>
                <p style={{
                  color: '#f8fafc',
                  fontSize: '14px',
                  lineHeight: '1.5',
                  margin: 0,
                  fontWeight: '500'
                }}>
                  {analysis.overall_tone}
                </p>
              </div>

              {/* Writing Style */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.06) 0%, rgba(255, 255, 255, 0.03) 100%)',
                backdropFilter: 'blur(12px) saturate(150%)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                padding: '16px',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)';
                e.currentTarget.style.borderColor = 'rgba(34, 197, 94, 0.3)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255, 255, 255, 0.06) 0%, rgba(255, 255, 255, 0.03) 100%)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
              >
                <h3 style={{
                  fontSize: '12px',
                  fontWeight: '700',
                  color: '#22c55e',
                  marginBottom: '8px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  ✍️ Writing Style
                </h3>
                <p style={{
                  color: '#f8fafc',
                  fontSize: '14px',
                  lineHeight: '1.5',
                  margin: 0,
                  fontWeight: '500'
                }}>
                  {analysis.writing_style}
                </p>
              </div>

              {/* Emotional Sentiment */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.06) 0%, rgba(255, 255, 255, 0.03) 100%)',
                backdropFilter: 'blur(12px) saturate(150%)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                padding: '16px',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)';
                e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.3)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255, 255, 255, 0.06) 0%, rgba(255, 255, 255, 0.03) 100%)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
              >
                <h3 style={{
                  fontSize: '12px',
                  fontWeight: '700',
                  color: '#a855f7',
                  marginBottom: '8px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  💭 Sentiment
                </h3>
                <p style={{
                  color: '#f8fafc',
                  fontSize: '14px',
                  lineHeight: '1.5',
                  margin: 0,
                  fontWeight: '500'
                }}>
                  {analysis.emotional_sentiment}
                </p>
              </div>

              {/* Engagement Level */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.06) 0%, rgba(255, 255, 255, 0.03) 100%)',
                backdropFilter: 'blur(12px) saturate(150%)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                padding: '16px',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)';
                e.currentTarget.style.borderColor = 'rgba(245, 158, 11, 0.3)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255, 255, 255, 0.06) 0%, rgba(255, 255, 255, 0.03) 100%)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
              >
                <h3 style={{
                  fontSize: '12px',
                  fontWeight: '700',
                  color: '#f59e0b',
                  marginBottom: '8px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  🔥 Engagement
                </h3>
                <p style={{
                  color: '#f8fafc',
                  fontSize: '14px',
                  lineHeight: '1.5',
                  margin: 0,
                  fontWeight: '500',
                  textTransform: 'capitalize'
                }}>
                  {analysis.engagement_level}
                </p>
              </div>
            </div>

            {/* Common Topics - Más compacto */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.06) 0%, rgba(255, 255, 255, 0.03) 100%)',
              backdropFilter: 'blur(12px) saturate(150%)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              padding: '16px',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)'
            }}>
              <h3 style={{
                fontSize: '14px',
                fontWeight: '700',
                color: '#60a5fa',
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                🏷️ Common Topics
              </h3>
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px'
              }}>
                {analysis.common_topics.map((topic, index) => (
                  <span
                    key={index}
                    style={{
                      padding: '6px 12px',
                      background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(59, 130, 246, 0.1) 100%)',
                      color: '#93c5fd',
                      borderRadius: '12px',
                      fontSize: '12px',
                      border: '1px solid rgba(59, 130, 246, 0.25)',
                      fontWeight: '600',
                      backdropFilter: 'blur(8px)',
                      transition: 'all 0.3s ease',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'linear-gradient(135deg, rgba(59, 130, 246, 0.25) 0%, rgba(59, 130, 246, 0.15) 100%)';
                      e.currentTarget.style.transform = 'translateY(-1px) scale(1.02)';
                      e.currentTarget.style.color = '#60a5fa';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(59, 130, 246, 0.1) 100%)';
                      e.currentTarget.style.transform = 'translateY(0) scale(1)';
                      e.currentTarget.style.color = '#93c5fd';
                    }}
                  >
                    {topic}
                  </span>
                ))}
              </div>
            </div>

            {/* Language Patterns - Más compacto */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.06) 0%, rgba(255, 255, 255, 0.03) 100%)',
              backdropFilter: 'blur(12px) saturate(150%)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              padding: '16px',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)'
            }}>
              <h3 style={{
                fontSize: '14px',
                fontWeight: '700',
                color: '#22c55e',
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                🗣️ Language Patterns
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {analysis.language_patterns.map((pattern, index) => (
                  <div 
                    key={index} 
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      color: '#f8fafc',
                      padding: '8px 12px',
                      background: 'rgba(34, 197, 94, 0.06)',
                      borderRadius: '8px',
                      border: '1px solid rgba(34, 197, 94, 0.15)',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(34, 197, 94, 0.1)';
                      e.currentTarget.style.transform = 'translateX(3px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(34, 197, 94, 0.06)';
                      e.currentTarget.style.transform = 'translateX(0)';
                    }}
                  >
                    <span style={{
                      width: '6px',
                      height: '6px',
                      background: '#22c55e',
                      borderRadius: '50%',
                      marginRight: '10px',
                      marginTop: '5px',
                      flexShrink: 0,
                      boxShadow: '0 0 6px rgba(34, 197, 94, 0.4)'
                    }}></span>
                    <span style={{
                      fontSize: '13px',
                      lineHeight: '1.5',
                      fontWeight: '500'
                    }}>
                      {pattern}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Suggestions - Más compacto */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.06) 0%, rgba(255, 255, 255, 0.03) 100%)',
              backdropFilter: 'blur(12px) saturate(150%)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              padding: '16px',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)'
            }}>
              <h3 style={{
                fontSize: '14px',
                fontWeight: '700',
                color: '#f59e0b',
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                💡 Improvement Suggestions
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {analysis.suggestions.map((suggestion, index) => (
                  <div 
                    key={index} 
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      color: '#f8fafc',
                      padding: '8px 12px',
                      background: 'rgba(245, 158, 11, 0.06)',
                      borderRadius: '8px',
                      border: '1px solid rgba(245, 158, 11, 0.15)',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(245, 158, 11, 0.1)';
                      e.currentTarget.style.transform = 'translateX(3px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(245, 158, 11, 0.06)';
                      e.currentTarget.style.transform = 'translateX(0)';
                    }}
                  >
                    <span style={{
                      width: '6px',
                      height: '6px',
                      background: '#f59e0b',
                      borderRadius: '50%',
                      marginRight: '10px',
                      marginTop: '5px',
                      flexShrink: 0,
                      boxShadow: '0 0 6px rgba(245, 158, 11, 0.4)'
                    }}></span>
                    <span style={{
                      fontSize: '13px',
                      lineHeight: '1.5',
                      fontWeight: '500'
                    }}>
                      {suggestion}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {!analysis && !isLoading && (
        <div style={{
          textAlign: 'center',
          padding: '32px 20px',
          color: '#94a3b8'
        }}>
          <div style={{
            fontSize: '48px',
            marginBottom: '20px',
            filter: 'drop-shadow(0 0 12px rgba(59, 130, 246, 0.3))'
          }}>
            🤖
          </div>
          <p style={{
            color: '#f1f5f9',
            marginBottom: '12px',
            fontSize: '18px',
            fontWeight: '600'
          }}>
            Analyze your writing style with artificial intelligence!
          </p>
          <p style={{
            fontSize: '14px',
            color: '#94a3b8',
            lineHeight: '1.6'
          }}>
            Use Gemini 2.5 Pro to get insights about your writing style on Twitter.
          </p>
        </div>
      )}
    </div>
  );
}