import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'panel' | 'intense' | 'subtle';
  hover?: boolean;
  interactive?: boolean;
  onClick?: () => void;
  role?: string;
  'aria-label'?: string;
  tabIndex?: number;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = '',
  variant = 'default',
  hover = false,
  interactive = false,
  onClick,
  role,
  'aria-label': ariaLabel,
  tabIndex,
}) => {
  // Determine the appropriate CSS class based on variant
  const getVariantClass = () => {
    switch (variant) {
      case 'panel':
        return 'glass-panel';
      case 'intense':
        return 'glass-card glass-intense';
      case 'subtle':
        return 'glass-card glass-subtle';
      default:
        return 'glass-card';
    }
  };

  // Build className string
  const combinedClassName = [
    getVariantClass(),
    hover && 'glass-hover',
    interactive && 'glass-interactive',
    className
  ].filter(Boolean).join(' ');

  // Determine if component should be interactive
  const isInteractive = onClick || interactive;
  const shouldHaveFocus = isInteractive || tabIndex !== undefined;

  return (
    <div
      className={combinedClassName}
      onClick={onClick}
      role={role || (isInteractive ? 'button' : undefined)}
      aria-label={ariaLabel}
      tabIndex={shouldHaveFocus ? (tabIndex ?? 0) : undefined}
      onKeyDown={isInteractive ? (e) => {
        if ((e.key === 'Enter' || e.key === ' ') && onClick) {
          e.preventDefault();
          onClick();
        }
      } : undefined}
      style={{
        cursor: isInteractive ? 'pointer' : 'default',
        outline: 'none', // Custom focus styles in CSS
      }}
    >
      {children}
    </div>
  );
}; 