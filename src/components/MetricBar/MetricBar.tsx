
import React from 'react';
import './MetricBar.css';

type MetricBarProps = {
  label: string;
  value: number;
  target: number;
  unit?: string;
};

export const MetricBar: React.FC<MetricBarProps> = ({ label, value, target, unit }) => {
  const ratio = target > 0 ? Math.min(value / target, 1.4) : 0;
  let status: 'low' | 'ok' | 'high' = 'ok';
  if (ratio < 0.85) status = 'low';
  else if (ratio > 1.15) status = 'high';

  return (
    <div className="MetricBar">
      <div className="MetricBar-top">
        <span className="MetricBar-label">{label}</span>
        <span className="MetricBar-values">
          {value.toFixed(0)}{unit} / {target.toFixed(0)}{unit}
        </span>
      </div>
      <div className="MetricBar-track">
        <div
          className={`MetricBar-fill MetricBar-fill--${status}`}
          style={{ width: `${Math.max(ratio * 100, 6)}%` }}
        />
        <div
          className="MetricBar-target"
          style={{ left: `${Math.min(100, 100)}%` }}
        />
      </div>
    </div>
  );
};
