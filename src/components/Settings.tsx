'use client';

import { useState, useEffect } from 'react';

interface SettingsConfig {
  twitterUsername: string;
  twitterApiKey: string;
  geminiApiKey: string;
}

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: SettingsConfig) => void;
  currentConfig: SettingsConfig;
}

export function Settings({ isOpen, onClose, onSave, currentConfig }: SettingsProps) {
  const [config, setConfig] = useState<SettingsConfig>(currentConfig);
  const [showApiKeys, setShowApiKeys] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setConfig(currentConfig);
  }, [currentConfig]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      onSave(config);
      setTimeout(() => {
        setIsSaving(false);
        onClose();
      }, 500);
    } catch (error) {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setConfig({
      twitterUsername: process.env.NEXT_PUBLIC_DEFAULT_USERNAME || '',
      twitterApiKey: '',
      geminiApiKey: ''
    });
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.8)',
      backdropFilter: 'blur(8px)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.08) 100%)',
        backdropFilter: 'blur(40px) saturate(200%)',
        border: '1px solid rgba(255, 255, 255, 0.25)',
        borderRadius: '24px',
        padding: '32px',
        maxWidth: '500px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        position: 'relative',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
        animation: 'scaleIn 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '32px',
          paddingBottom: '20px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.15)'
        }}>
          <h2 style={{
            fontSize: '24px',
            fontWeight: '700',
            color: '#f8fafc',
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <span style={{ fontSize: '28px' }}>⚙️</span>
            Settings
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(220, 38, 38, 0.15) 100%)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '12px',
              color: '#fca5a5',
              fontSize: '18px',
              width: '40px',
              height: '40px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(239, 68, 68, 0.3) 0%, rgba(220, 38, 38, 0.2) 100%)';
              e.currentTarget.style.transform = 'scale(1.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(220, 38, 38, 0.15) 100%)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            ✕
          </button>
        </div>

        {/* Settings Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Twitter Username */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: '#cbd5e1',
              marginBottom: '8px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              🐦 Twitter/X Account
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{
                position: 'absolute',
                left: '16px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#94a3b8',
                fontSize: '16px',
                fontWeight: '600',
                pointerEvents: 'none'
              }}>
                @
              </span>
              <input
                type="text"
                value={config.twitterUsername}
                onChange={(e) => setConfig(prev => ({ ...prev, twitterUsername: e.target.value }))}
                placeholder={process.env.NEXT_PUBLIC_DEFAULT_USERNAME || 'username'}
                style={{
                  width: '100%',
                  padding: '16px 16px 16px 36px',
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '16px',
                  color: '#f8fafc',
                  fontSize: '16px',
                  fontWeight: '500',
                  backdropFilter: 'blur(10px)',
                  transition: 'all 0.3s ease',
                  outline: 'none'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.5)';
                  e.currentTarget.style.boxShadow = '0 0 0 2px rgba(59, 130, 246, 0.2)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            </div>
            <p style={{
              fontSize: '12px',
              color: '#94a3b8',
              margin: '8px 0 0 0',
              lineHeight: '1.4'
            }}>
              The Twitter/X account from which to analyze tweets (without @)
            </p>
          </div>

          {/* API Keys Section */}
          <div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px'
            }}>
              <h3 style={{
                fontSize: '16px',
                fontWeight: '600',
                color: '#e2e8f0',
                margin: 0
              }}>
                🔐 API Keys
              </h3>
              <button
                onClick={() => setShowApiKeys(!showApiKeys)}
                style={{
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '10px',
                  color: '#f8fafc',
                  fontSize: '12px',
                  fontWeight: '600',
                  padding: '8px 12px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.08) 100%)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)';
                }}
              >
                {showApiKeys ? '🙈 Hide' : '👁️ Show'}
              </button>
            </div>

            {/* RapidAPI Key */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '600',
                color: '#cbd5e1',
                marginBottom: '8px'
              }}>
                🚀 RapidAPI Key (Twitter v24)
              </label>
              <input
                type={showApiKeys ? "text" : "password"}
                value={config.twitterApiKey}
                onChange={(e) => setConfig(prev => ({ ...prev, twitterApiKey: e.target.value }))}
                placeholder="Your RapidAPI key for Twitter v24..."
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.04) 100%)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '12px',
                  color: '#f8fafc',
                  fontSize: '14px',
                  fontWeight: '500',
                  backdropFilter: 'blur(10px)',
                  transition: 'all 0.3s ease',
                  outline: 'none',
                  fontFamily: showApiKeys ? 'inherit' : 'monospace'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.5)';
                  e.currentTarget.style.boxShadow = '0 0 0 2px rgba(59, 130, 246, 0.2)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
              <p style={{
                fontSize: '11px',
                color: '#94a3b8',
                margin: '6px 0 0 0',
                lineHeight: '1.4'
              }}>
                Get your key at <a href="https://rapidapi.com/Glavier/api/twitter-v24" target="_blank" style={{ color: '#60a5fa' }}>RapidAPI Twitter v24</a>
              </p>
            </div>

            {/* Gemini API Key */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '600',
                color: '#cbd5e1',
                marginBottom: '8px'
              }}>
                🤖 Gemini API Key
              </label>
              <input
                type={showApiKeys ? "text" : "password"}
                value={config.geminiApiKey}
                onChange={(e) => setConfig(prev => ({ ...prev, geminiApiKey: e.target.value }))}
                placeholder="Your Google Gemini API key..."
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.04) 100%)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '12px',
                  color: '#f8fafc',
                  fontSize: '14px',
                  fontWeight: '500',
                  backdropFilter: 'blur(10px)',
                  transition: 'all 0.3s ease',
                  outline: 'none',
                  fontFamily: showApiKeys ? 'inherit' : 'monospace'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.5)';
                  e.currentTarget.style.boxShadow = '0 0 0 2px rgba(59, 130, 246, 0.2)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
              <p style={{
                fontSize: '11px',
                color: '#94a3b8',
                margin: '6px 0 0 0',
                lineHeight: '1.4'
              }}>
                Get your key at <a href="https://makersuite.google.com/app/apikey" target="_blank" style={{ color: '#60a5fa' }}>Google AI Studio</a>
              </p>
            </div>
          </div>

          {/* Warning */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(245, 158, 11, 0.1) 100%)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: '16px',
            padding: '16px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px'
          }}>
            <span style={{ fontSize: '20px', flexShrink: 0 }}>⚠️</span>
            <div>
              <p style={{
                fontSize: '13px',
                color: '#fbbf24',
                margin: '0 0 8px 0',
                fontWeight: '600'
              }}>
                Important Security Notice
              </p>
              <p style={{
                fontSize: '12px',
                color: '#f59e0b',
                margin: 0,
                lineHeight: '1.5'
              }}>
                API keys are stored locally in your browser and are not sent to any external servers. They are only used to make direct calls to the corresponding APIs.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          gap: '12px',
          marginTop: '32px',
          paddingTop: '24px',
          borderTop: '1px solid rgba(255, 255, 255, 0.15)'
        }}>
          <button
            onClick={handleReset}
            style={{
              flex: '0 0 auto',
              padding: '12px 20px',
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '12px',
              color: '#94a3b8',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.08) 100%)';
              e.currentTarget.style.color = '#f8fafc';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)';
              e.currentTarget.style.color = '#94a3b8';
            }}
          >
            🔄 Resetear
          </button>
          <button
            onClick={onClose}
            style={{
              flex: '1',
              padding: '12px 20px',
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '12px',
              color: '#f8fafc',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.08) 100%)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)';
            }}
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            style={{
              flex: '1',
              padding: '12px 20px',
              background: isSaving 
                ? 'linear-gradient(135deg, rgba(100, 116, 139, 0.6) 0%, rgba(71, 85, 105, 0.6) 100%)'
                : 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              border: 'none',
              borderRadius: '12px',
              color: '#ffffff',
              fontSize: '14px',
              fontWeight: '600',
              cursor: isSaving ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: isSaving ? 'none' : '0 6px 20px rgba(59, 130, 246, 0.35)'
            }}
            onMouseEnter={(e) => {
              if (!isSaving) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(59, 130, 246, 0.45)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isSaving) {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(59, 130, 246, 0.35)';
              }
            }}
          >
            {isSaving ? (
              <>
                <div style={{
                  width: '14px',
                  height: '14px',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  borderTop: '2px solid #ffffff',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }}/>
                Saving...
              </>
            ) : (
              <>
                💾 Save
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}