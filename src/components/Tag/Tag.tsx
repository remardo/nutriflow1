
import React from 'react';
import './Tag.css';

type TagProps = {
  label: string;
  color?: 'default' | 'green' | 'orange' | 'red' | 'blue';
  subtle?: boolean;
};

export const Tag: React.FC<TagProps> = ({ label, color = 'default', subtle }) => {
  const className = ['Tag', `Tag--${color}`, subtle ? 'Tag--subtle' : '']
    .filter(Boolean)
    .join(' ');
  return <span className={className}>{label}</span>;
};
