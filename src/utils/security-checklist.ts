/**
 * Security Checklist and Implementation Status
 * X Personal Assistant Security Configuration
 */

export interface SecurityCheck {
  category: string;
  item: string;
  status: 'implemented' | 'pending' | 'needs_review';
  description: string;
  priority: 'high' | 'medium' | 'low';
}

export const SECURITY_CHECKLIST: SecurityCheck[] = [
  // API Security
  {
    category: 'API Security',
    item: 'Rate Limiting',
    status: 'implemented',
    description: 'Rate limiting implemented for all API endpoints with configurable limits',
    priority: 'high'
  },
  {
    category: 'API Security',
    item: 'Input Validation',
    status: 'implemented',
    description: 'All user inputs are validated and sanitized to prevent XSS and injection attacks',
    priority: 'high'
  },
  {
    category: 'API Security',
    item: 'API Key Validation',
    status: 'implemented',
    description: 'API keys are validated for format and masked in logs',
    priority: 'high'
  },
  {
    category: 'API Security',
    item: 'Error Handling',
    status: 'implemented',
    description: 'Secure error handling that prevents sensitive information leakage',
    priority: 'high'
  },

  // Authentication & Authorization
  {
    category: 'Authentication',
    item: 'Configuration Endpoint Protection',
    status: 'implemented',
    description: 'Configuration endpoints protected with Bearer token authentication',
    priority: 'high'
  },
  {
    category: 'Authentication',
    item: 'Environment Variable Protection',
    status: 'implemented',
    description: 'Sensitive environment variables never exposed to client-side',
    priority: 'high'
  },

  // Data Protection
  {
    category: 'Data Protection',
    item: 'Secure Logging',
    status: 'implemented',
    description: 'Logging system that respects production environment and masks sensitive data',
    priority: 'medium'
  },
  {
    category: 'Data Protection',
    item: 'API Key Masking',
    status: 'implemented',
    description: 'API keys are masked in logs and responses for security',
    priority: 'high'
  },
  {
    category: 'Data Protection',
    item: 'Input Sanitization',
    status: 'implemented',
    description: 'All user inputs sanitized to prevent XSS and limit length',
    priority: 'high'
  },

  // Network Security
  {
    category: 'Network Security',
    item: 'HTTPS Headers',
    status: 'implemented',
    description: 'Security headers including HSTS, CSP, X-Frame-Options configured',
    priority: 'high'
  },
  {
    category: 'Network Security',
    item: 'CORS Configuration',
    status: 'implemented',
    description: 'CORS properly configured with environment-specific origins',
    priority: 'medium'
  },

  // File Security
  {
    category: 'File Security',
    item: 'Gitignore Patterns',
    status: 'needs_review',
    description: 'Enhanced .gitignore patterns needed for additional sensitive files',
    priority: 'medium'
  },
  {
    category: 'File Security',
    item: 'Environment Template',
    status: 'implemented',
    description: 'Comprehensive env.example with all required variables',
    priority: 'low'
  },

  // Production Security
  {
    category: 'Production',
    item: 'Domain Configuration',
    status: 'needs_review',
    description: 'Production domain needs to be configured in next.config.js',
    priority: 'high'
  },
  {
    category: 'Production',
    item: 'Build Security',
    status: 'implemented',
    description: 'Secure build scripts with type checking and security audits',
    priority: 'medium'
  },

  // Testing Security
  {
    category: 'Testing',
    item: 'Test Data Sanitization',
    status: 'implemented',
    description: 'Test files use generic data instead of real credentials',
    priority: 'medium'
  },
];

/**
 * Get security status summary
 */
export function getSecurityStatus(): {
  implemented: number;
  pending: number;
  needsReview: number;
  total: number;
  score: number;
} {
  const implemented = SECURITY_CHECKLIST.filter(item => item.status === 'implemented').length;
  const pending = SECURITY_CHECKLIST.filter(item => item.status === 'pending').length;
  const needsReview = SECURITY_CHECKLIST.filter(item => item.status === 'needs_review').length;
  const total = SECURITY_CHECKLIST.length;
  const score = Math.round((implemented / total) * 100);

  return {
    implemented,
    pending,
    needsReview,
    total,
    score
  };
}

/**
 * Get high priority security items that need attention
 */
export function getHighPriorityItems(): SecurityCheck[] {
  return SECURITY_CHECKLIST.filter(
    item => item.priority === 'high' && item.status !== 'implemented'
  );
}

/**
 * Validate production readiness
 */
export function validateProductionReadiness(): {
  isReady: boolean;
  issues: string[];
  recommendations: string[];
} {
  const issues: string[] = [];
  const recommendations: string[] = [];

  // Check for high priority unimplemented items
  const highPriorityIssues = getHighPriorityItems();
  if (highPriorityIssues.length > 0) {
    issues.push(
      `${highPriorityIssues.length} high priority security items need attention`
    );
  }

  // Check environment variables
  const requiredEnvVars = [
    'TWITTER_RAPIDAPI_KEY',
    'GEMINI_API_KEY',
    'CONFIG_SECRET',
    'NEXT_PUBLIC_APP_URL'
  ];

  const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
  if (missingEnvVars.length > 0) {
    issues.push(`Missing environment variables: ${missingEnvVars.join(', ')}`);
  }

  // Recommendations
  recommendations.push('Regularly update dependencies for security patches');
  recommendations.push('Monitor API usage and implement alerting for unusual patterns');
  recommendations.push('Regular security audits and penetration testing');
  recommendations.push('Implement proper logging and monitoring in production');

  return {
    isReady: issues.length === 0,
    issues,
    recommendations
  };
}

/**
 * Security configuration constants
 */
export const SECURITY_CONSTANTS = {
  // Rate limiting
  DEFAULT_RATE_LIMIT: 60,
  STRICT_RATE_LIMIT: 10,
  RATE_LIMIT_WINDOW: 60000, // 1 minute

  // Input validation
  MAX_INPUT_LENGTH: 2000,
  MAX_USERNAME_LENGTH: 15,
  MIN_API_KEY_LENGTH: 20,

  // File patterns that should never be committed
  SENSITIVE_FILE_PATTERNS: [
    '*.env',
    '*.env.*',
    'secrets/*',
    'credentials/*',
    '*.pem',
    '*.key',
    '*.p12',
    '*.p8',
    'config.json',
    'secrets.json'
  ],

  // Headers for security
  SECURITY_HEADERS: {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload'
  }
}; 