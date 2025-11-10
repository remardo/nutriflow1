
import React from 'react';
import './PillTabs.css';

export type PillTabOption = {
  id: string;
  label: string;
};

type PillTabsProps = {
  options: PillTabOption[];
  value: string;
  onChange: (id: string) => void;
  size?: 'sm' | 'md';
};

export const PillTabs: React.FC<PillTabsProps> = ({ options, value, onChange, size = 'md' }) => {
  return (
    <div className={`PillTabs PillTabs--${size}`}>
      {options.map((opt) => (
        <button
          key={opt.id}
          className={`PillTabs-item ${value === opt.id ? 'is-active' : ''}`}
          onClick={() => onChange(opt.id)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
};
