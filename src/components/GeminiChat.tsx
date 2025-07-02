'use client';

import { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '@/types/gemini';
import { GlassCard } from './ui/GlassCard';

interface GeminiChatProps {
  onSendMessage: (message: string) => Promise<string>;
  isLoading: boolean;
}

export function GeminiChat({ onSendMessage, isLoading }: GeminiChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');

    try {
      const response = await onSendMessage(inputMessage);
      
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '❌ Error getting response. Please try again.',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  return (
    <div 
      className="gemini-chat"
      style={{
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        borderRadius: '20px',
        padding: '24px',
        height: '600px',
        maxHeight: '70vh',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 12px 40px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.15)'
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

      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '24px',
        paddingBottom: '20px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.12)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span style={{ 
            fontSize: '28px', 
            marginRight: '16px',
            filter: 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.5))'
          }}>
            🤖
          </span>
          <div>
            <h2 style={{
              fontSize: '22px',
              fontWeight: '700',
              color: '#f8fafc',
              margin: 0,
              letterSpacing: '-0.02em'
            }}>
              Chat with Gemini
            </h2>
            <p style={{
              fontSize: '13px',
              color: '#94a3b8',
              margin: '4px 0 0 0',
              fontWeight: '500'
            }}>
              Powered by Gemini 2.0 Flash
            </p>
          </div>
        </div>
        {messages.length > 0 && (
          <button
            onClick={clearChat}
            style={{
              padding: '8px 16px',
              fontSize: '12px',
              background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(220, 38, 38, 0.15) 100%)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#fca5a5',
              borderRadius: '12px',
              cursor: 'pointer',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              fontWeight: '600',
              backdropFilter: 'blur(10px)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(239, 68, 68, 0.3) 0%, rgba(220, 38, 38, 0.2) 100%)';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(220, 38, 38, 0.15) 100%)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            🗑️ Clear
          </button>
        )}
      </div>

      {/* Messages Area */}
      <div style={{
        height: '320px',
        overflowY: 'auto',
        marginBottom: '16px',
        paddingRight: '8px',
        minHeight: 0
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {messages.length === 0 && (
            <div style={{
              textAlign: 'center',
              color: '#94a3b8',
              padding: '40px 20px'
            }}>
              <div style={{ 
                fontSize: '48px', 
                marginBottom: '20px',
                filter: 'drop-shadow(0 0 12px rgba(59, 130, 246, 0.3))'
              }}>
                💬
              </div>
              <p style={{
                marginBottom: '12px',
                fontSize: '18px',
                fontWeight: '600',
                color: '#f8fafc'
              }}>
                Hello! I'm your personal Twitter assistant.
              </p>
              <p style={{
                fontSize: '15px',
                color: '#94a3b8',
                lineHeight: '1.6'
              }}>
                Ask me anything about your tweets, content strategies, or analysis.
              </p>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              style={{
                display: 'flex',
                justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start'
              }}
            >
              <div
                style={{
                  maxWidth: '85%',
                  padding: '16px 20px',
                  borderRadius: '16px',
                  background: message.role === 'user'
                    ? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)'
                    : 'linear-gradient(135deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.08) 100%)',
                  color: '#ffffff',
                  backdropFilter: message.role === 'assistant' ? 'blur(10px)' : 'none',
                  border: message.role === 'assistant' ? '1px solid rgba(255, 255, 255, 0.15)' : 'none',
                  boxShadow: message.role === 'user'
                    ? '0 8px 24px rgba(59, 130, 246, 0.3)'
                    : '0 8px 24px rgba(0, 0, 0, 0.2)',
                  position: 'relative',
                  animation: 'fadeIn 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              >
                <div style={{
                  fontSize: '15px',
                  whiteSpace: 'pre-wrap',
                  lineHeight: '1.6',
                  fontWeight: '400'
                }}>
                  {message.content}
                </div>
                <div style={{
                  fontSize: '12px',
                  marginTop: '8px',
                  opacity: 0.8,
                  color: message.role === 'user' ? '#dbeafe' : '#94a3b8',
                  fontWeight: '500'
                }}>
                  {message.timestamp.toLocaleTimeString('es', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <div style={{
                padding: '16px 20px',
                borderRadius: '16px',
                maxWidth: '200px',
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.08) 100%)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                backdropFilter: 'blur(10px)',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <div style={{
                    width: '20px',
                    height: '20px',
                    border: '2px solid rgba(59, 130, 246, 0.3)',
                    borderTop: '2px solid #3b82f6',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }}/>
                  <span style={{
                    fontSize: '14px',
                    color: '#60a5fa',
                    fontWeight: '600'
                  }}>
                    Gemini is typing...
                  </span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
        <textarea
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Write your message..."
          style={{
            flex: 1,
            padding: '16px 20px',
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.04) 100%)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '16px',
            color: '#f8fafc',
            fontSize: '15px',
            resize: 'none',
            minHeight: '52px',
            maxHeight: '120px',
            outline: 'none',
            backdropFilter: 'blur(10px)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            fontFamily: 'inherit',
            lineHeight: '1.5'
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.5)';
            e.currentTarget.style.boxShadow = '0 0 0 2px rgba(59, 130, 246, 0.2)';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
            e.currentTarget.style.boxShadow = 'none';
          }}
          rows={2}
          disabled={isLoading}
        />
        <button
          onClick={handleSendMessage}
          disabled={!inputMessage.trim() || isLoading}
          style={{
            padding: '16px 20px',
            background: !inputMessage.trim() || isLoading
              ? 'linear-gradient(135deg, rgba(100, 116, 139, 0.6) 0%, rgba(71, 85, 105, 0.6) 100%)'
              : 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
            border: 'none',
            borderRadius: '16px',
            color: '#ffffff',
            fontSize: '18px',
            cursor: !inputMessage.trim() || isLoading ? 'not-allowed' : 'pointer',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            fontWeight: '600',
            minWidth: '60px',
            height: '52px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: !inputMessage.trim() || isLoading
              ? 'none'
              : '0 6px 20px rgba(59, 130, 246, 0.35)'
          }}
          onMouseEnter={(e) => {
            if (!isLoading && inputMessage.trim()) {
              e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(59, 130, 246, 0.45)';
            }
          }}
          onMouseLeave={(e) => {
            if (!isLoading && inputMessage.trim()) {
              e.currentTarget.style.transform = 'translateY(0) scale(1)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(59, 130, 246, 0.35)';
            }
          }}
        >
          {isLoading ? (
            <div style={{
              width: '20px',
              height: '20px',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              borderTop: '2px solid #ffffff',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}/>
          ) : (
            '📤'
          )}
        </button>
      </div>

      {/* Quick Actions */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '8px',
        marginTop: '16px'
      }}>
        {messages.length === 0 && (
          <>
            <button
              onClick={() => setInputMessage('How can I improve my engagement on Twitter?')}
              style={{
                padding: '8px 16px',
                fontSize: '12px',
                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(59, 130, 246, 0.15) 100%)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                color: '#60a5fa',
                borderRadius: '16px',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                fontWeight: '600',
                backdropFilter: 'blur(10px)'
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
              💡 Engagement Tips
            </button>
            <button
              onClick={() => setInputMessage('Sugiere ideas para tweets sobre tecnología')}
              style={{
                padding: '8px 16px',
                fontSize: '12px',
                background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.2) 0%, rgba(34, 197, 94, 0.15) 100%)',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                color: '#22c55e',
                borderRadius: '16px',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                fontWeight: '600',
                backdropFilter: 'blur(10px)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(34, 197, 94, 0.3) 0%, rgba(34, 197, 94, 0.2) 100%)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(34, 197, 94, 0.2) 0%, rgba(34, 197, 94, 0.15) 100%)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              🚀 Content Ideas
            </button>
            <button
              onClick={() => setInputMessage('Analyze current trends in my niche')}
              style={{
                padding: '8px 16px',
                fontSize: '12px',
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(139, 92, 246, 0.15) 100%)',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                color: '#a855f7',
                borderRadius: '16px',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                fontWeight: '600',
                backdropFilter: 'blur(10px)'
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
              📈 Trends
            </button>
          </>
        )}
      </div>
    </div>
  );
}