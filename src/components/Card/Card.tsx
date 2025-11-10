
import React from 'react';
import './Card.css';

type CardProps = {
  title?: string;
  subtitle?: string;
  right?: React.ReactNode;
  children?: React.ReactNode;
  onClick?: () => void;
  variant?: 'default' | 'soft' | 'danger' | 'success';
  compact?: boolean;
};

export const Card: React.FC<CardProps> = ({
  title,
  subtitle,
  right,
  children,
  onClick,
  variant = 'default',
  compact,
}) => {
  const className = [
    'Card',
    `Card--${variant}`,
    compact ? 'Card--compact' : '',
    onClick ? 'Card--clickable' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={className} onClick={onClick}>
      {(title || subtitle || right) && (
        <div className="Card-header">
          <div>
            {title && <div className="Card-title">{title}</div>}
            {subtitle && <div className="Card-subtitle">{subtitle}</div>}
          </div>
          {right && <div className="Card-right">{right}</div>}
        </div>
      )}
      {children && <div className="Card-body">{children}</div>}
    </div>
  );
};
